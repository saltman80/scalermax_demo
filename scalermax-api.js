const { logRequest, logResponse, logError } = require('./logger');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const MAX_PROMPT_LENGTH = parseInt(process.env.MAX_PROMPT_LENGTH) || 2000;
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 512;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 60;
const AUTH_API_KEY = process.env.API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const rateLimitMap = new Map();

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message })
  };
}

function classifyPrompt(prompt) {
  const text = prompt.toLowerCase();
  const patterns = [
    { intent: 'coding', keywords: ['code', 'bug', 'error', 'function', 'variable', 'javascript', 'python', 'java', 'typescript'] },
    { intent: 'writing', keywords: ['write', 'email', 'letter', 'blog', 'article', 'story', 'essay'] },
    { intent: 'summarization', keywords: ['summarize', 'summary', 'tl;dr', 'overview'] }
  ];
  for (const { intent, keywords } of patterns) {
    if (keywords.some(k => text.includes(k))) return intent;
  }
  return 'general';
}

const ROUTER_CONFIG = {
  coding: { model: process.env.CODING_MODEL || 'gpt-4o-mini' },
  writing: { model: process.env.WRITING_MODEL || 'gpt-3.5-turbo' },
  summarization: { model: process.env.SUMMARIZATION_MODEL || 'gpt-3.5-turbo' },
  general: { model: process.env.GENERAL_MODEL || 'gpt-3.5-turbo' }
};

exports.handler = async function(event, context) {
  const headers = Object.keys(event.headers || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = event.headers[key];
    return acc;
  }, {});
  logRequest({
    method: event.httpMethod,
    path: event.path || '/',
    headers: {
      'user-agent': headers['user-agent'],
      'x-forwarded-for': headers['x-forwarded-for'] || headers['x-nf-client-connection-ip']
    }
  });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method Not Allowed');
  }
  if (!AUTH_API_KEY) {
    logError('Missing server API_KEY');
    return errorResponse(500, 'Server misconfiguration');
  }
  const clientApiKey = headers['x-api-key'];
  if (!clientApiKey || clientApiKey !== AUTH_API_KEY) {
    return errorResponse(401, 'Unauthorized');
  }
  const clientId = headers['x-forwarded-for'] || headers['x-nf-client-connection-ip'] || 'unknown';
  const now = Date.now();
  let record = rateLimitMap.get(clientId);
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    record = { count: 1, lastReset: now };
    rateLimitMap.set(clientId, record);
  } else {
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
      return errorResponse(429, 'Too Many Requests');
    }
    record.count += 1;
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    logError(err);
    return errorResponse(400, 'Invalid JSON');
  }
  const prompt = body.prompt;
  const userId = body.userId;
  let temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
  temperature = Math.min(Math.max(temperature, 0.0), 1.0);
  if (!prompt || typeof prompt !== 'string') {
    return errorResponse(400, 'Missing prompt');
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return errorResponse(400, `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`);
  }
  if (!OPENROUTER_API_KEY) {
    logError('Missing OPENROUTER_API_KEY');
    return errorResponse(500, 'Server misconfiguration');
  }
  const intent = classifyPrompt(prompt);
  const route = ROUTER_CONFIG[intent] || ROUTER_CONFIG.general;
  const messages = [
    { role: 'system', content: `You are a helpful assistant specialized in ${intent} tasks.` },
    { role: 'user', content: prompt }
  ];
  const payload = {
    model: route.model,
    messages,
    temperature,
    stream: false,
    user: userId,
    max_tokens: MAX_TOKENS
  };
  let aiResponse = '';
  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      logError({ status: res.status, body: json });
      const errorMsg = json.error || 'AI service error';
      return errorResponse(res.status || 500, errorMsg);
    }
    aiResponse = json.choices?.[0]?.message?.content || '';
  } catch (err) {
    logError(err);
    return errorResponse(502, 'AI service communication error');
  }
  const responseBody = { intent, model: route.model, response: aiResponse };
  logResponse(responseBody);
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody)
  };
};