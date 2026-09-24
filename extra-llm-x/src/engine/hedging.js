/**
 * Speculative Parallel Hedging Engine (OmniRoute / LiteLLM Enterprise Parity)
 * Eliminates long tail latencies by racing a backup provider if the primary provider
 * does not respond within hedgeDelayMs.
 */
export class SpeculativeHedgingEngine {
  constructor(defaultHedgeDelayMs = 3500) {
    this.defaultHedgeDelayMs = defaultHedgeDelayMs;
  }

  /**
   * Races primary provider execution with a speculative fallback after hedgeDelayMs
   */
  async executeHedged({
    primaryFn,
    fallbackFn,
    hedgeDelayMs = this.defaultHedgeDelayMs,
    onPrimarySlow = null
  }) {
    let primaryCompleted = false;
    let fallbackStarted = false;
    let timerId = null;

    const primaryPromise = (async () => {
      try {
        const result = await primaryFn();
        primaryCompleted = true;
        if (timerId) clearTimeout(timerId);
        return { source: 'primary', result };
      } catch (err) {
        if (timerId) clearTimeout(timerId);
        throw err;
      }
    })();

    if (!fallbackFn) {
      const res = await primaryPromise;
      return res.result;
    }

    const fallbackPromise = new Promise((resolve, reject) => {
      timerId = setTimeout(async () => {
        if (primaryCompleted) return;
        fallbackStarted = true;
        if (onPrimarySlow) onPrimarySlow();

        try {
          const result = await fallbackFn();
          if (!primaryCompleted) {
            resolve({ source: 'fallback', result });
          }
        } catch (err) {
          if (!primaryCompleted) {
            reject(err);
          }
        }
      }, hedgeDelayMs);
    });

    try {
      const winner = await Promise.race([primaryPromise, fallbackPromise]);
      return {
        ...winner.result,
        hedged: winner.source === 'fallback'
      };
    } catch (firstError) {
      // If primary failed fast before fallback was triggered, attempt fallback immediately
      if (!fallbackStarted) {
        if (timerId) clearTimeout(timerId);
        try {
          const fallbackRes = await fallbackFn();
          return {
            ...fallbackRes,
            hedged: true,
            fallbackOccurred: true
          };
        } catch (fallbackError) {
          throw firstError;
        }
      }
      throw firstError;
    }
  }
}

export const speculativeHedging = new SpeculativeHedgingEngine();
