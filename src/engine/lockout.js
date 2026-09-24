/**
 * Extra LLM X — Model Lockout & Circuit Breaker (OmniRoute Compatible)
 *
 * Ported from OmniRoute's domain/lockoutPolicy.ts.
 * Implements exponential backoff quarantine for unstable or rate-limited models.
 */

export class LockoutPolicy {
  constructor(config = {}) {
    this.maxAttempts = config.maxAttempts || 3;
    this.baseLockoutMs = config.baseLockoutMs || 15000;  // 15 seconds
    this.maxLockoutMs = config.maxLockoutMs || 900000;   // 15 minutes
    this.cache = new Map(); // targetId -> { fails: number, lockedUntil: number }
  }

  isLocked(targetId) {
    const entry = this.cache.get(targetId);
    if (!entry || !entry.lockedUntil) return false;

    if (Date.now() >= entry.lockedUntil) {
      // Cooldown expired, clear lock
      entry.lockedUntil = 0;
      return false;
    }
    return true;
  }

  recordFailure(targetId) {
    let entry = this.cache.get(targetId);
    if (!entry) {
      entry = { fails: 0, lockedUntil: 0 };
      this.cache.set(targetId, entry);
    }

    entry.fails += 1;

    if (entry.fails >= this.maxAttempts) {
      // Compute exponential duration
      const multiplier = Math.pow(2, Math.min(entry.fails - this.maxAttempts, 6));
      const duration = Math.min(this.baseLockoutMs * multiplier, this.maxLockoutMs);
      entry.lockedUntil = Date.now() + duration;
      return { locked: true, durationMs: duration, fails: entry.fails };
    }

    return { locked: false, fails: entry.fails };
  }

  recordSuccess(targetId) {
    this.cache.delete(targetId);
  }

  getLockStatus(targetId) {
    const entry = this.cache.get(targetId);
    if (!entry) return { isLocked: false, fails: 0, remainingMs: 0 };

    const remainingMs = Math.max(0, (entry.lockedUntil || 0) - Date.now());
    return {
      isLocked: remainingMs > 0,
      fails: entry.fails,
      remainingMs
    };
  }

  clearAll() {
    this.cache.clear();
  }
}

export const lockoutPolicy = new LockoutPolicy();
