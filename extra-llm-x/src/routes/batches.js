import express from 'express';
import crypto from 'crypto';
import { BatchStore } from '../db/database.js';
import { routerEngine } from '../engine/router.js';

export const batchRouter = express.Router();

/**
 * POST /v1/batches — Create an asynchronous batch execution job
 */
batchRouter.post('/batches', async (req, res) => {
  try {
    const { requests = [], endpoint = '/v1/chat/completions', metadata = {} } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: {
          message: 'The requests array is required and must contain at least one item.',
          type: 'invalid_request_error',
          param: 'requests',
          code: 'empty_batch'
        }
      });
    }

    const batchId = `batch_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const totalRequests = requests.length;

    BatchStore.createBatch({
      id: batchId,
      totalRequests,
      requestsJson: JSON.stringify(requests)
    });

    const responseObj = {
      id: batchId,
      object: 'batch',
      endpoint,
      status: 'in_progress',
      created_at: Math.floor(Date.now() / 1000),
      in_progress_at: Math.floor(Date.now() / 1000),
      request_counts: {
        total: totalRequests,
        completed: 0,
        failed: 0
      },
      metadata
    };

    res.status(201).json(responseObj);

    // Asynchronously execute batch requests in background
    processBatchAsync(batchId, requests, req.clientKey).catch(err => {
      console.warn(`[BatchEngine] Batch ${batchId} processing error:`, err.message);
    });

  } catch (err) {
    res.status(500).json({ error: { message: err.message, type: 'api_error' } });
  }
});

/**
 * GET /v1/batches/:id — Retrieve batch status and progress
 */
batchRouter.get('/batches/:id', (req, res) => {
  try {
    const batch = BatchStore.getBatch(req.params.id);
    if (!batch) {
      return res.status(404).json({
        error: {
          message: `Batch '${req.params.id}' not found`,
          type: 'invalid_request_error'
        }
      });
    }

    res.json({
      id: batch.id,
      object: 'batch',
      endpoint: '/v1/chat/completions',
      status: batch.status,
      created_at: Math.floor(batch.created_at / 1000),
      completed_at: batch.completed_at ? Math.floor(batch.completed_at / 1000) : null,
      request_counts: {
        total: batch.total_requests,
        completed: batch.completed_requests,
        failed: batch.failed_requests
      }
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /v1/batches/:id/results — Retrieve batch execution results
 */
batchRouter.get('/batches/:id/results', (req, res) => {
  try {
    const batch = BatchStore.getBatch(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: { message: 'Batch not found' } });
    }

    const results = batch.results_json ? JSON.parse(batch.results_json) : [];
    res.json({
      object: 'list',
      batch_id: batch.id,
      status: batch.status,
      data: results
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /v1/batches/:id/cancel — Cancel pending batch execution
 */
batchRouter.post('/batches/:id/cancel', (req, res) => {
  try {
    BatchStore.cancelBatch(req.params.id);
    const batch = BatchStore.getBatch(req.params.id);
    res.json({
      id: req.params.id,
      object: 'batch',
      status: batch?.status || 'cancelled'
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * Background worker to process batch requests sequentially with failover
 */
async function processBatchAsync(batchId, requests, clientKey) {
  let completed = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < requests.length; i++) {
    // Check if cancelled
    const current = BatchStore.getBatch(batchId);
    if (!current || current.status === 'cancelled') {
      console.log(`[BatchEngine] Batch ${batchId} was cancelled by client.`);
      break;
    }

    const reqItem = requests[i];
    const customId = reqItem.custom_id || `req_${i}`;
    const body = reqItem.body || {};

    try {
      const dispatchResult = await routerEngine.dispatch({
        clientKey: clientKey || 'batch-client',
        requestedModel: body.model || 'extra/auto-free',
        messages: body.messages || [{ role: 'user', content: 'Batch prompt' }],
        stream: false,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 1024,
        tools: body.tools
      });

      let resData = null;
      if (dispatchResult.isCached) {
        resData = dispatchResult.cachedData;
      } else {
        resData = await dispatchResult.response.json();
      }

      completed++;
      results.push({
        id: `batch_res_${i}`,
        custom_id: customId,
        response: {
          status_code: 200,
          request_id: resData.id || `chatcmpl_batch_${i}`,
          body: resData
        },
        error: null
      });
    } catch (err) {
      failed++;
      results.push({
        id: `batch_res_${i}`,
        custom_id: customId,
        response: null,
        error: {
          message: err.message,
          code: err.status || 500
        }
      });
    }

    // Update progress periodically in SQLite
    BatchStore.updateBatchProgress(batchId, {
      completedRequests: completed,
      failedRequests: failed,
      status: i === requests.length - 1 ? 'completed' : 'in_progress',
      resultsJson: JSON.stringify(results),
      completedAt: i === requests.length - 1 ? Date.now() : null
    });
  }
}
