import { WebhookStore } from '../db/database.js';

export class WebhookEngine {
  constructor() {
    this.timeoutMs = 5000;
  }

  /**
   * Broadcasts an event to all matching registered webhook subscribers
   */
  async dispatch(event, payload = {}) {
    const webhooks = WebhookStore.getWebhooksForEvent(event);
    if (!webhooks || webhooks.length === 0) return [];

    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    const formattedPayload = {
      event,
      deliveryId,
      timestamp,
      data: payload,
      // Discord and Slack compatibility format
      content: this.formatDiscordMessage(event, payload)
    };

    const results = await Promise.allSettled(
      webhooks.map(async (whk) => {
        try {
          const res = await fetch(whk.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Extra-LLM-X-Webhook-Engine/1.0',
              'X-ExtraLLMX-Event': event,
              'X-ExtraLLMX-Delivery': deliveryId,
              ...(whk.secret ? { 'X-ExtraLLMX-Signature': whk.secret } : {})
            },
            body: JSON.stringify(formattedPayload),
            signal: AbortSignal.timeout(this.timeoutMs)
          });

          const success = res.ok;
          WebhookStore.recordTrigger(whk.id, success);
          return { id: whk.id, url: whk.url, status: res.status, success };
        } catch (err) {
          WebhookStore.recordTrigger(whk.id, false);
          return { id: whk.id, url: whk.url, success: false, error: err.message };
        }
      })
    );

    return results.map(r => r.value || { success: false, error: r.reason?.message });
  }

  /**
   * Sends a test ping to verify a webhook URL
   */
  async testPing(url, secret = null) {
    const testPayload = {
      event: 'test_ping',
      deliveryId: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        message: '⚡ Extra LLM X Webhook Test Handshake OK! Real-time alerts connected.',
        server: 'http://localhost:3000'
      },
      content: '⚡ **[Extra LLM X]** Webhook connection verified successfully!'
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Extra-LLM-X-Webhook-Engine/1.0',
          'X-ExtraLLMX-Event': 'test_ping',
          ...(secret ? { 'X-ExtraLLMX-Signature': secret } : {})
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      return {
        success: res.ok,
        status: res.status,
        statusText: res.statusText
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Formats human-readable alert message compatible with Discord/Slack webhooks
   */
  formatDiscordMessage(event, data) {
    switch (event) {
      case 'failover':
        return `⚠️ **[Extra LLM X Failover]** Model \`${data.requestedModel}\` failed over from \`${data.failedProvider}\` to **\`${data.targetProvider}/${data.targetModel}\`** (${data.latencyMs || 0}ms)`;
      case 'rate_limit':
        return `⏳ **[Extra LLM X Rate Limit]** Provider \`${data.provider}\` entered cooldown for ${data.cooldownSec || 60}s. Auto-failover redirected traffic.`;
      case 'lockout':
        return `🛡️ **[Circuit Breaker]** Provider target \`${data.targetId}\` locked out due to consecutive errors.`;
      case 'benchmark':
        return `🏆 **[Rankings Updated]** New ELO Podium Champion: **#1 ${data.championName}** (${data.eloScore} ELO, ${data.speedTokPerSec} tok/s)`;
      case 'milestone':
        return `💰 **[Token Milestone]** Extra LLM X has processed **${Number(data.totalTokens).toLocaleString()} free tokens**! Estimated savings: **$${data.savingsUsd}**!`;
      default:
        return `⚡ **[Extra LLM X Alert]** Event \`${event}\`: ${JSON.stringify(data)}`;
    }
  }
}

export const webhookEngine = new WebhookEngine();
