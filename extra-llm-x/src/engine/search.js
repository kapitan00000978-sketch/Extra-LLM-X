/**
 * Extra LLM X - 100% Free Live Web Search Grounding Engine
 * Fetches real-time search results via DuckDuckGo without any API key or subscription.
 */
import https from 'https';

export class FreeSearchEngine {
  /**
   * Search the live web for a given query
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
   */
  static async search(query, limit = 5) {
    if (!query || !query.trim()) return [];

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
      
      const html = await this._fetchHtml(url);
      const results = this._parseDuckDuckGoHtml(html, limit);

      if (results.length > 0) return results;

      // Fallback: Instant answer API
      const instantUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
      return await this._fetchInstantAnswer(instantUrl);
    } catch (err) {
      console.warn('[FreeSearchEngine] Search failed:', err.message);
      return [];
    }
  }

  /**
   * Automatically grounds messages with live web search results if requested
   * @param {Array<{role: string, content: string}>} messages
   * @param {number} [limit=4]
   * @returns {Promise<{messages: Array, searchResults: Array, query: string}>}
   */
  static async groundMessages(messages, limit = 4) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return { messages, searchResults: [], query: '' };
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg || typeof lastUserMsg.content !== 'string') {
      return { messages, searchResults: [], query: '' };
    }

    const query = lastUserMsg.content.slice(0, 150).trim();
    const searchResults = await this.search(query, limit);

    if (searchResults.length === 0) {
      return { messages, searchResults: [], query };
    }

    const citationText = searchResults.map((r, i) => `[${i + 1}] "${r.title}": ${r.snippet} (Source: ${r.url})`).join('\n\n');
    const groundingSystemPrompt = `\n\n### LIVE WEB SEARCH CONTEXT (Retrieved in real-time):\n${citationText}\n\nUse the above verified live search sources to answer accurately with citations where applicable.`;

    const cloned = JSON.parse(JSON.stringify(messages));
    const systemIdx = cloned.findIndex(m => m.role === 'system');

    if (systemIdx >= 0) {
      cloned[systemIdx].content += groundingSystemPrompt;
    } else {
      cloned.unshift({ role: 'system', content: groundingSystemPrompt.trim() });
    }

    return { messages: cloned, searchResults, query };
  }

  static _fetchHtml(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Search request timed out')); });
    });
  }

  static _parseDuckDuckGoHtml(html, limit) {
    const results = [];
    const snippetBlocks = [...html.matchAll(/<a[^>]*class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
    const titleBlocks = [...html.matchAll(/<a[^>]*class="result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
    const urlBlocks = [...html.matchAll(/<a[^>]*class="result__url[^"]*"[^>]*href="([^"]+)"[^>]*>/gi)];

    const count = Math.min(limit, Math.max(snippetBlocks.length, titleBlocks.length));
    for (let i = 0; i < count; i++) {
      const title = titleBlocks[i] ? titleBlocks[i][1].replace(/<[^>]+>/g, '').trim() : 'Search Result';
      const snippet = snippetBlocks[i] ? snippetBlocks[i][1].replace(/<[^>]+>/g, '').trim() : '';
      let url = urlBlocks[i] ? urlBlocks[i][1].trim() : 'https://duckduckgo.com';
      
      if (url.includes('uddg=')) {
        try {
          const match = url.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            url = decodeURIComponent(match[1]);
          }
        } catch { /* ignore */ }
      }

      if (snippet || title) {
        results.push({ title, url, snippet });
      }
    }
    return results;
  }

  static _fetchInstantAnswer(url) {
    return new Promise((resolve) => {
      const req = https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 ExtraLLMX/1.0' },
        timeout: 3000
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const results = [];
            if (parsed.AbstractText) {
              results.push({
                title: parsed.Heading || 'Instant Answer',
                url: parsed.AbstractURL || '',
                snippet: parsed.AbstractText
              });
            }
            if (Array.isArray(parsed.RelatedTopics)) {
              for (const topic of parsed.RelatedTopics.slice(0, 3)) {
                if (topic.Text) {
                  results.push({
                    title: topic.FirstURL ? topic.FirstURL.split('/').pop().replace(/_/g, ' ') : 'Related Topic',
                    url: topic.FirstURL || '',
                    snippet: topic.Text
                  });
                }
              }
            }
            resolve(results);
          } catch {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });
  }
}
