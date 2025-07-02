const fetch = globalThis.fetch || require('node-fetch');
const DEFAULT_TIMEOUT_MS = process.env.OPENROUTER_TIMEOUT_MS
  ? parseInt(process.env.OPENROUTER_TIMEOUT_MS, 10)
  : 10000;
const DEFAULT_RETRIES = 3;

// For demo purposes a hardcoded API key can be placed below.
// Leave as an empty string to rely on the OPENROUTER_API_KEY environment variable.
const HARDCODED_API_KEY = '';

async function sendRequest(model, prompt, options = {}) {
  const apiKey =
    options.apiKey || process.env.OPENROUTER_API_KEY || HARDCODED_API_KEY;
  const url =
    options.url ||
    process.env.OPENROUTER_URL ||
    'https://openrouter.ai/api/v1/chat/completions';
  const timeoutMs = options.timeoutMs != null ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
  const retries = options.retries != null ? options.retries : DEFAULT_RETRIES;

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('OpenRouter API key is required and must be a non-empty string');
  }
  if (typeof model !== 'string' || !model.trim()) {
    throw new Error('Model parameter is required and must be a non-empty string');
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt parameter is required and must be a non-empty string');
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId;
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller ? controller.signal : undefined,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.error?.message || response.statusText;
        throw new Error(`OpenRouter API error: ${msg}`);
      }
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Unexpected OpenRouter response format');
      }
      return content;
    } catch (err) {
      if (attempt === retries - 1) {
        if (err.name === 'AbortError') {
          throw new Error(`OpenRouter API request timed out after ${timeoutMs} ms`);
        }
        throw new Error(`Network error while calling OpenRouter API: ${err.message}`);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  throw new Error(`OpenRouter API call failed after ${retries} attempts`);
}

module.exports = { sendRequest };