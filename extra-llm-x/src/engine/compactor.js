/**
 * Extra LLM X - Context Compactor & Token Optimizer
 * Extends small free model context limits indefinitely by summarizing and compacting
 * historical conversation turns while keeping key facts and recent dialog intact.
 */

export class ContextCompactor {
  /**
   * Estimates rough token count for a message array
   * @param {Array<{role: string, content: string}>} messages
   * @returns {number}
   */
  static estimateTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((acc, m) => {
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '');
      return acc + Math.ceil(text.length / 3.8) + 4;
    }, 0);
  }

  /**
   * Compacts conversation messages if they exceed maxTokens or on demand
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} [options]
   * @param {number} [options.maxTokens=3000]
   * @param {number} [options.keepRecent=4]
   * @returns {{ messages: Array, tokensBefore: number, tokensAfter: number, compacted: boolean, tokensSaved: number }}
   */
  static compact(messages, { maxTokens = 3000, keepRecent = 4 } = {}) {
    if (!Array.isArray(messages) || messages.length <= keepRecent + 1) {
      const tokens = this.estimateTokens(messages);
      return { messages, tokensBefore: tokens, tokensAfter: tokens, compacted: false, tokensSaved: 0 };
    }

    const tokensBefore = this.estimateTokens(messages);
    if (tokensBefore <= maxTokens) {
      return { messages, tokensBefore, tokensAfter: tokensBefore, compacted: false, tokensSaved: 0 };
    }

    // Extract system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    if (nonSystem.length <= keepRecent) {
      return { messages, tokensBefore, tokensAfter: tokensBefore, compacted: false, tokensSaved: 0 };
    }

    // Split into older turns and recent turns
    const olderTurns = nonSystem.slice(0, nonSystem.length - keepRecent);
    const recentTurns = nonSystem.slice(nonSystem.length - keepRecent);

    // Build condensed summary of older turns (distill to short gist)
    const recapPoints = [];
    for (const turn of olderTurns) {
      const rawText = typeof turn.content === 'string'
        ? turn.content.replace(/\s+/g, ' ').trim()
        : '';
      const gist = rawText.length > 50 ? rawText.slice(0, 50) + '...' : rawText;
      recapPoints.push(`- [${turn.role}]: ${gist}`);
    }

    const summaryContent = `[CONVERSATION RECAP - older history compacted]:\n${recapPoints.join('\n')}`;

    const compactedList = [
      ...systemMessages,
      { role: 'system', content: summaryContent },
      ...recentTurns
    ];

    const tokensAfter = this.estimateTokens(compactedList);

    return {
      messages: compactedList,
      tokensBefore,
      tokensAfter,
      compacted: true,
      tokensSaved: Math.max(0, tokensBefore - tokensAfter)
    };
  }
}
