const fetch = globalThis.fetch || require('node-fetch');
const DEFAULT_TIMEOUT_MS = process.env.OPENROUTER_TIMEOUT_MS
  ? parseInt(process.env.OPENROUTER_TIMEOUT_MS, 10)
  : 10000;

async function sendRequest(model, prompt, options = {}) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  const url =
    options.url ||
    process.env.OPENROUTER_URL ||
    'https://openrouter.ai/v1/chat/completions';
  const timeoutMs = options.timeoutMs != null ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('OpenRouter API key is required and must be a non-empty string');
  }
  if (typeof model !== 'string' || !model.trim()) {
    throw new Error('Model parameter is required and must be a non-empty string');
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt parameter is required and must be a non-empty string');
  }

  const controller = typeof AbortController !== 'undefined'
    ? new AbortController()
    : null;
  let timeoutId;
  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  let response;
  try {
    response = await fetch(url, {
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
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter API request timed out after ${timeoutMs} ms`);
    }
    throw new Error(`Network error while calling OpenRouter API: ${err.message}`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenRouter response: ${err.message}`);
  }

  if (!response.ok) {
    const msg = data.error?.message || response.statusText;
    throw new Error(`OpenRouter API error: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected OpenRouter response format');
  }

  return content;
}

module.exports = { sendRequest };