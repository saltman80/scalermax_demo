const {
  logRequest,
  logResponse,
  logError,
  logModelSelection,
} = require("./logger");
const { sendRequest } = require("./openrouterclient");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const MAX_PROMPT_LENGTH = parseInt(process.env.MAX_PROMPT_LENGTH) || 2000;
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 512;
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const MAX_REQUESTS_PER_WINDOW =
  parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 60;

const SCALERMAX_BACKEND_KEY =
  process.env.VITE_SCALERMAX_BACKEND_KEY ||
  'xyz789-scalermax-secret';
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AUTH_API_KEY = SCALERMAX_BACKEND_KEY;
const OPENROUTER_API_URL =
  `${OPENROUTER_BASE_URL.replace(/\/$/, '')}/chat/completions`;

if (!AUTH_API_KEY) {
  console.error("❌ Missing VITE_SCALERMAX_BACKEND_KEY in environment");
}
if (!OPENROUTER_API_KEY) {
  console.error("❌ Missing OPENROUTER_API_KEY in environment");
}

const rateLimitMap = new Map();

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

function classifyPrompt(prompt) {
  const text = prompt.toLowerCase();
  const codingKeywords = [
    "code",
    "bug",
    "error",
    "function",
    "variable",
    "javascript",
    "python",
    "java",
    "typescript",
    "c++",
    "ruby",
    "php",
  ];
  if (codingKeywords.some((k) => text.includes(k))) {
    return "coding";
  }
  return "planning";
}

const ROUTER_CONFIG = {
  coding: { model: process.env.CODING_MODEL || "openai/o4-mini-high" },
  planning: { model: process.env.PLANNING_MODEL || "openai/gpt-4o-mini" },
};

exports.handler = async function (event, context) {
  const headers = Object.keys(event.headers || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = event.headers[key];
    return acc;
  }, {});
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Method Not Allowed");
  }
  if (!AUTH_API_KEY) {
    logError(
      "Missing VITE_SCALERMAX_BACKEND_KEY (used for API auth)",
    );
    return errorResponse(500, "Server misconfiguration: Missing API key");
  }
  const clientApiKey = headers["x-api-key"];
  console.log("[Debug] Expected key:", AUTH_API_KEY);
  console.log("[Debug] Received key:", clientApiKey);
  if (!clientApiKey || clientApiKey !== AUTH_API_KEY) {
    return errorResponse(
      401,
      "Unauthorized: x-api-key header missing or invalid",
    );
  }
  const clientId =
    headers["x-forwarded-for"] ||
    headers["x-nf-client-connection-ip"] ||
    "unknown";
  const now = Date.now();
  let record = rateLimitMap.get(clientId);
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    record = { count: 1, lastReset: now };
    rateLimitMap.set(clientId, record);
  } else {
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
      return errorResponse(429, "Too Many Requests");
    }
    record.count += 1;
  }
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    logError(err);
    return errorResponse(400, "Invalid JSON");
  }
  logRequest({
    httpMethod: event.httpMethod,
    path: event.path || "/",
    headers: {
      "user-agent": headers["user-agent"],
      "x-forwarded-for":
        headers["x-forwarded-for"] || headers["x-nf-client-connection-ip"],
    },
    queryStringParameters: event.queryStringParameters,
    body,
  });
  const prompt = body.prompt;
  const userId = body.userId;
  let temperature =
    typeof body.temperature === "number" ? body.temperature : 0.7;
  temperature = Math.min(Math.max(temperature, 0.0), 1.0);

  if (!OPENROUTER_API_KEY) {
    console.error("❌ Missing OPENROUTER_API_KEY in environment");
    return errorResponse(
      500,
      "Server misconfiguration: missing OpenRouter API key. Please set OPENROUTER_API_KEY in your environment variables."
    );
  }

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return errorResponse(400, "Missing or empty prompt");
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return errorResponse(
      400,
      `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`,
    );
  }
  const intent = classifyPrompt(prompt);
  const route = ROUTER_CONFIG[intent] || ROUTER_CONFIG.planning;
  logModelSelection(intent, route.model);
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant specialized in ${intent} tasks.`,
    },
    { role: "user", content: prompt },
  ];
  const payload = {
    model: route.model,
    messages,
    temperature,
    stream: false,
    user: userId,
    max_tokens: MAX_TOKENS,
  };
  let aiResponse = "";
  try {
    aiResponse = await sendRequest(payload.model, prompt, {
      apiKey: OPENROUTER_API_KEY,
      url: OPENROUTER_API_URL,
    });
  } catch (err) {
    logError(err);
    return errorResponse(502, err.message);
  }
  const responseBody = { intent, model: route.model, response: aiResponse };
  logResponse(responseBody);
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(responseBody),
  };
};
