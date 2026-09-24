/**
 * Extra LLM X — Prompt Compression Engine (OmniRoute Compatible)
 *
 * Implements OmniRoute's modular prompt compression pipeline to proactively
 * save 15-35% tokens on free models, preventing quota exhaustion.
 */

export class PromptCompressionEngine {
  collapseWhitespace(text) {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/[ \t]+/g, ' ')               // Collapse consecutive horizontal whitespace
      .replace(/\n{3,}/g, '\n\n')            // Max 2 consecutive newlines
      .trim();
  }

  dedupSystemPrompt(messages) {
    if (!Array.isArray(messages)) return messages;

    const seenSystemPrompts = new Set();
    const result = [];

    for (const msg of messages) {
      if (msg.role === 'system' && typeof msg.content === 'string') {
        const normalized = msg.content.trim();
        if (seenSystemPrompts.has(normalized)) {
          // Skip redundant system prompt
          continue;
        }
        seenSystemPrompts.add(normalized);
      }
      result.push(msg);
    }

    return result;
  }

  compressMessages(messages, mode = 'lite') {
    if (!messages || !Array.isArray(messages) || mode === 'off') {
      return { messages, tokensSaved: 0, ratio: 0, compressed: false };
    }

    let initialChars = 0;
    messages.forEach(m => {
      if (typeof m.content === 'string') initialChars += m.content.length;
    });

    // 1. Deduplicate system prompts
    let processed = this.dedupSystemPrompt(messages);

    // 2. Whitespace & structural compaction
    processed = processed.map(m => {
      if (typeof m.content !== 'string') return m;
      let text = this.collapseWhitespace(m.content);

      if (mode === 'standard') {
        // Standard mode: remove filler phrases common in prompt templates
        text = text
          .replace(/Please make sure to /gi, '')
          .replace(/Note that /gi, '')
          .replace(/In order to /gi, 'To ');
      }

      return { ...m, content: text };
    });

    let finalChars = 0;
    processed.forEach(m => {
      if (typeof m.content === 'string') finalChars += m.content.length;
    });

    const charsSaved = Math.max(0, initialChars - finalChars);
    const tokensSaved = Math.round(charsSaved / 4);
    const ratio = initialChars > 0 ? Math.round((charsSaved / initialChars) * 100) : 0;

    return {
      messages: processed,
      tokensSaved,
      ratio,
      compressed: charsSaved > 0
    };
  }

  estimateTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text' && typeof part.text === 'string') {
            totalChars += part.text.length;
          }
        }
      }
    }
    // Standard rule of thumb: ~4 characters per token for English & code
    return Math.ceil(totalChars / 4) + (messages.length * 4);
  }

  pruneMessagesForBudget(messages, maxTokens = 8192) {
    if (!Array.isArray(messages) || messages.length <= 2) {
      return { messages, pruned: false, estimatedTokens: this.estimateTokens(messages) };
    }

    let estimated = this.estimateTokens(messages);
    if (estimated <= maxTokens) {
      return { messages, pruned: false, estimatedTokens: estimated };
    }

    // Separate system messages and conversation turns
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system');

    // Always preserve at least the last 2 conversation turns
    const preservedTailCount = Math.min(conversation.length, 4);
    const tailMessages = conversation.slice(-preservedTailCount);
    let middleMessages = conversation.slice(0, -preservedTailCount);

    // Iteratively drop older middle messages until under budget
    while (middleMessages.length > 0 && estimated > maxTokens) {
      middleMessages.shift(); // Drop oldest turn
      const candidate = [...systemMessages, ...middleMessages, ...tailMessages];
      estimated = this.estimateTokens(candidate);
    }

    const prunedMessages = [...systemMessages, ...middleMessages, ...tailMessages];
    return {
      messages: prunedMessages,
      pruned: prunedMessages.length < messages.length,
      originalTokens: this.estimateTokens(messages),
      estimatedTokens: estimated
    };
  }
}

export const promptCompression = new PromptCompressionEngine();
