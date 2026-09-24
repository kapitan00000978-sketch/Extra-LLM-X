/**
 * Extra LLM X - Universal Tool & Function Calling Polyfill
 * Translates OpenAI JSON Schema tools into universal prompt instructions,
 * and parses model responses back into standard OpenAI tool_calls: [...] format.
 */

export class ToolCallingPolyfill {
  /**
   * Enhances messages with tool calling prompt if tools are present
   * @param {Array} messages
   * @param {Array} tools
   * @returns {Array} enhanced messages
   */
  static injectToolsPrompt(messages, tools) {
    if (!Array.isArray(tools) || tools.length === 0) {
      return messages;
    }

    const toolDocs = tools.map(t => {
      const fn = t.function || t;
      return JSON.stringify({
        name: fn.name,
        description: fn.description || '',
        parameters: fn.parameters || {}
      }, null, 2);
    }).join('\n\n');

    const instruction = `\n\n### FUNCTION CALLING INSTRUCTIONS:
You have access to the following callable tools:
${toolDocs}

To execute a tool call, output ONLY the tool call wrapped strictly in <tool_call> tags:
<tool_call>
{"name": "function_name", "arguments": { ... }}
</tool_call>
You may provide multiple <tool_call> tags if parallel execution is needed. If no tool is needed, respond with normal text.`;

    const cloned = JSON.parse(JSON.stringify(messages));
    const systemIdx = cloned.findIndex(m => m.role === 'system');

    if (systemIdx >= 0) {
      cloned[systemIdx].content += instruction;
    } else {
      cloned.unshift({ role: 'system', content: instruction.trim() });
    }

    return cloned;
  }

  /**
   * Extracts tool calls from model generated text and parses into OpenAI format
   * @param {string} content
   * @returns {{ cleanContent: string, toolCalls: Array|null }}
   */
  static extractToolCalls(content) {
    if (!content || typeof content !== 'string') {
      return { cleanContent: content || '', toolCalls: null };
    }

    const toolCalls = [];
    const regex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
    let match;
    let index = 1;

    while ((match = regex.exec(content)) !== null) {
      const rawJson = match[1].trim();
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed.name) {
          toolCalls.push({
            id: `call_${Date.now()}_${index++}`,
            type: 'function',
            function: {
              name: parsed.name,
              arguments: typeof parsed.arguments === 'string'
                ? parsed.arguments
                : JSON.stringify(parsed.arguments || parsed.parameters || {})
            }
          });
        }
      } catch {
        // Graceful fallback for non-strict JSON
      }
    }

    // Clean out <tool_call> tags from final text
    const cleanContent = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').trim();

    return {
      cleanContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : null
    };
  }
}
