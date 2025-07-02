const { randomUUID } = require('crypto')
const MAX_BODY_LENGTH = parseInt(process.env.LOG_MAX_BODY_LENGTH, 10) || 1000

function maskSensitive(data) {
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => maskSensitive(item))
    }
    const result = {}
    for (const [key, value] of Object.entries(data)) {
      if (/(authorization|token|password|secret)/i.test(key)) {
        result[key] = '*****'
      } else {
        result[key] = maskSensitive(value)
      }
    }
    return result
  }
  return data
}

function safeParse(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {}
  }
  return body
}

function safeStringify(obj) {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  })
}

function truncate(data) {
  if (typeof data === 'string') {
    return data.length > MAX_BODY_LENGTH ? data.slice(0, MAX_BODY_LENGTH) + '...' : data
  }
  let stringified
  try {
    stringified = safeStringify(data)
  } catch {
    stringified = String(data)
  }
  if (stringified.length > MAX_BODY_LENGTH) {
    return stringified.slice(0, MAX_BODY_LENGTH) + '...'
  }
  if (data && typeof data === 'object') {
    try {
      return JSON.parse(stringified)
    } catch {
      return data
    }
  }
  return data
}

function logRequest(event) {
  const requestId = randomUUID()
  const { httpMethod: method, path, headers, queryStringParameters: query } = event
  const parsedBody = safeParse(event.body)
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    requestId,
    message: 'Incoming request',
    data: {
      method,
      path,
      headers: maskSensitive(headers || {}),
      query: truncate(maskSensitive(query || {})),
      body: truncate(maskSensitive(parsedBody))
    }
  }
  console.log(safeStringify(entry))
  return requestId
}

function logResponse(response, requestId = null) {
  const { statusCode, headers, body } = response
  const parsedBody = safeParse(body)
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Outgoing response',
    data: {
      statusCode,
      headers: maskSensitive(headers || {}),
      body: truncate(maskSensitive(parsedBody))
    }
  }
  if (requestId) entry.requestId = requestId
  console.log(safeStringify(entry))
}

function logError(error, requestId = null) {
  const err = error instanceof Error ? error : new Error(String(error))
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    stack: err.stack
  }
  if (requestId) entry.requestId = requestId
  console.error(safeStringify(entry))
}

function logModelSelection(intent, model) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Model selection',
    data: { intent, model }
  }
  console.log(safeStringify(entry))
}

module.exports = {
  logRequest,
  logResponse,
  logError,
  logModelSelection,
  safeStringify
}