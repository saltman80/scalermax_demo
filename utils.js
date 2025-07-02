const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const DEFAULT_KEY_LENGTH = 32;
const MAX_KEY_LENGTH = 128;

export function generateApiKey(length = DEFAULT_KEY_LENGTH) {
  if (!Number.isInteger(length) || length <= 0 || length > MAX_KEY_LENGTH) {
    throw new Error(`API key length must be an integer between 1 and ${MAX_KEY_LENGTH}`);
  }
  const charset = CHARSET;
  const charsetLength = charset.length;
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const values = new Uint8Array(length);
    globalThis.crypto.getRandomValues(values);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charsetLength];
    }
    return result;
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node && typeof require === 'function') {
    try {
      const { randomBytes } = require('crypto');
      const bytes = randomBytes(length);
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charsetLength];
      }
      return result;
    } catch {
      // ignore and fall through
    }
  }
  throw new Error('Secure random generator not available. generateApiKey requires Web Crypto API or Node.js crypto module.');
}

export function formatTimestamp(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid timestamp');
  }
  const pad = n => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function copyToClipboard(text) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('copyToClipboard can only be used in a browser environment'));
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!successful) {
    return Promise.reject(new Error('copy command was unsuccessful'));
  }
  return Promise.resolve();
}