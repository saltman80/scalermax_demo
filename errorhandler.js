const { safeStringify } = require('./logger');

const defaultHeaders = {
  'Content-Type': 'application/json'
};

function clampStatusCode(code) {
  return code >= 100 && code <= 599 ? code : 500;
}

function formatErrorResponse(error) {
  let statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : parseInt(error.statusCode, 10) || 500;
  statusCode = clampStatusCode(statusCode);
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';
  const response = { error: { code, message } };

  if (process.env.NODE_ENV !== 'production') {
    if (error.details !== undefined) {
      response.error.details = error.details;
    }
    if (error.stack) {
      response.error.stack = error.stack;
    }
  }

  return {
    statusCode,
    headers: { ...defaultHeaders },
    body: safeStringify(response)
  };
}

function handleError(errInput) {
  let error;
  if (errInput instanceof Error) {
    error = errInput;
  } else if (typeof errInput === 'object' && errInput !== null) {
    error = new Error(errInput.message || 'An unexpected error occurred');
    if ('statusCode' in errInput) error.statusCode = errInput.statusCode;
    if ('code' in errInput) error.code = errInput.code;
    if ('details' in errInput) error.details = errInput.details;
    if (errInput.stack) error.stack = errInput.stack;
    for (const key of Object.keys(errInput)) {
      if (!['message', 'statusCode', 'code', 'details', 'stack'].includes(key)) {
        error[key] = errInput[key];
      }
    }
  } else {
    error = new Error(String(errInput || 'An unexpected error occurred'));
  }

  console.error(`[Error] ${new Date().toISOString()} -`, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    ...(error.details && { details: error.details })
  });

  return formatErrorResponse(error);
}

module.exports = {
  handleError,
  formatErrorResponse
};