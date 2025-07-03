let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    // Lazy load node-fetch only if needed
    fetchFn = (...args) => import('node-fetch').then(m => m.default(...args));
  } catch {
    throw new Error('Fetch API is not available. Install node-fetch to proceed.');
  }
}

const DEFAULT_BASE_URL = process.env.OPENROUTER_BASE_URL ||
  'https://openrouter.ai/api/v1';


async function sendRequest(model, prompt, options = {}) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const url = options.url || `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  if (!apiKey || !apiKey.trim()) {
    console.error('❌ Missing OPENROUTER_API_KEY in environment');
    throw new Error('OpenRouter API key is missing.');
  }
  if (!model || !prompt) {
    throw new Error('Missing model or prompt in sendRequest()');
  }

  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error(`❌ OpenRouter Error [${res.status}]: ${text}`);
        throw new Error(`OpenRouter API error ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Unexpected OpenRouter response format');
      return content;
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err.message);
      if (attempt === 2) throw new Error(`Final OpenRouter failure: ${err.message}`);
    }
  }
}

module.exports = { sendRequest };
