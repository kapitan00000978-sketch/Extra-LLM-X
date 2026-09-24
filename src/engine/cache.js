import crypto from 'crypto';
import { CacheStore } from '../db/database.js';

export class ResponseCacheEngine {
  constructor(defaultTtlSeconds = 86400) { // 24 hours default TTL
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.memoryLru = new Map(); // Fast in-memory L1 cache (up to 200 items)
    this.maxLruSize = 200;
  }

  /**
   * Generates a deterministic SHA-256 hash for a request payload
   */
  computeHash({ requestedModel, messages, temperature = 0.7, max_tokens, tools }) {
    const canonicalPayload = {
      model: (requestedModel || '').toLowerCase().trim(),
      messages: (messages || []).map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.trim() : m.content
      })),
      temp: typeof temperature === 'number' ? Math.round(temperature * 100) / 100 : 0.7,
      max_tokens: max_tokens || null,
      tools: tools || null
    };

    const str = JSON.stringify(canonicalPayload);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Checks whether caching is skipped by request headers
   */
  shouldSkip(req) {
    if (!req || !req.headers) return false;
    const skipHeader = req.headers['x-cache-skip'] || req.headers['x-no-cache'];
    const cacheControl = req.headers['cache-control'];
    return skipHeader === 'true' || cacheControl === 'no-cache' || cacheControl === 'no-store';
  }

  /**
   * Look up cached response (L1 memory -> L2 SQLite)
   */
  get(hash) {
    // 1. Check L1 Memory
    if (this.memoryLru.has(hash)) {
      const entry = this.memoryLru.get(hash);
      if (entry.expiresAt > Date.now()) {
        entry.hitCount++;
        CacheStore.incrementHit(hash);
        // Refresh position in Map
        this.memoryLru.delete(hash);
        this.memoryLru.set(hash, entry);
        return {
          data: entry.data,
          promptTokens: entry.promptTokens,
          completionTokens: entry.completionTokens,
          hitCount: entry.hitCount,
          source: 'l1_memory'
        };
      } else {
        this.memoryLru.delete(hash);
      }
    }

    // 2. Check L2 SQLite
    const row = CacheStore.get(hash);
    if (row) {
      // Warm up L1 Memory
      this._addToL1(hash, row.data, row.promptTokens, row.completionTokens, 3600);
      return {
        ...row,
        source: 'l2_sqlite'
      };
    }

    return null;
  }

  /**
   * Save response to cache (both L1 memory and L2 SQLite)
   */
  set(hash, requestedModel, responseData, promptTokens = 0, completionTokens = 0, ttlSeconds = null) {
    const ttl = ttlSeconds || this.defaultTtlSeconds;
    this._addToL1(hash, responseData, promptTokens, completionTokens, ttl);
    CacheStore.set(hash, requestedModel, responseData, promptTokens, completionTokens, ttl);
  }

  _addToL1(hash, data, promptTokens, completionTokens, ttlSeconds) {
    if (this.memoryLru.size >= this.maxLruSize) {
      const firstKey = this.memoryLru.keys().next().value;
      if (firstKey) this.memoryLru.delete(firstKey);
    }
    this.memoryLru.set(hash, {
      data,
      promptTokens,
      completionTokens,
      hitCount: 1,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  clear() {
    this.memoryLru.clear();
    return CacheStore.clear();
  }

  getStats() {
    const dbStats = CacheStore.getStats();
    return {
      ...dbStats,
      l1MemoryEntries: this.memoryLru.size
    };
  }
}

export const responseCache = new ResponseCacheEngine();
