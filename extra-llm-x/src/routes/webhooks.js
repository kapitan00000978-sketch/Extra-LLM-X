import express from 'express';
import { WebhookStore } from '../db/database.js';
import { webhookEngine } from '../engine/webhooks.js';

export const webhookRouter = express.Router();

/**
 * GET /api/webhooks — List all registered webhooks
 */
webhookRouter.get('/webhooks', (req, res) => {
  try {
    const list = WebhookStore.getAllWebhooks();
    res.json({ success: true, webhooks: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/webhooks — Create a new webhook subscriber
 */
webhookRouter.post('/webhooks', (req, res) => {
  try {
    const { url, events = 'all', secret = null } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'A valid http/https webhook URL is required.' });
    }

    const created = WebhookStore.createWebhook({ url, events, secret });
    res.status(201).json({ success: true, webhook: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/webhooks/:id — Delete a webhook
 */
webhookRouter.delete('/webhooks/:id', (req, res) => {
  try {
    WebhookStore.deleteWebhook(req.params.id);
    res.json({ success: true, deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/webhooks/:id/toggle — Toggle webhook active state
 */
webhookRouter.post('/webhooks/:id/toggle', (req, res) => {
  try {
    const { active } = req.body;
    WebhookStore.toggleWebhook(req.params.id, active);
    res.json({ success: true, id: req.params.id, active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/webhooks/test — Send immediate test ping to a webhook URL
 */
webhookRouter.post('/webhooks/test', async (req, res) => {
  try {
    const { url, secret } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'A valid http/https webhook URL is required.' });
    }

    const result = await webhookEngine.testPing(url, secret);
    res.json({ success: result.success, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
