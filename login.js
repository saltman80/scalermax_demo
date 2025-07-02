(function() {
const LOGIN_FORM_ID = 'login-form';
  const USERNAME_INPUT_ID = 'username';
  const PASSWORD_INPUT_ID = 'password';
  const SUBMIT_BUTTON_ID = 'login-submit';
  const SPINNER_ID = 'spinner';
  const ERROR_MSG_ID = 'error-msg';
  const AUTH_TOKEN_KEY = 'authToken';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

  let failedAttempts = 0;
  let lockUntil = 0;

  function initLogin() {
    const form = document.getElementById(LOGIN_FORM_ID);
    if (!form) return;
    hideSpinner();
    clearError();
    form.addEventListener('submit', handleLogin);
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearError();

    if (Date.now() < lockUntil) {
      const secondsLeft = Math.ceil((lockUntil - Date.now()) / 1000);
      showError(`Too many failed attempts. Try again in ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}.`);
      return;
    }

    const usernameEl = document.getElementById(USERNAME_INPUT_ID);
    const passwordEl = document.getElementById(PASSWORD_INPUT_ID);
    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';

    if (!username || !password) {
      showError('Username and password are required.');
      return;
    }

    toggleForm(false);
    showSpinner();

    try {
      await simulateLogin(username, password);
      failedAttempts = 0;
      lockUntil = 0;
      redirectToDashboard();
    } catch (error) {
      failedAttempts++;
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockUntil = Date.now() + LOCK_TIME_MS;
        showError(`Too many failed attempts. Please wait ${Math.ceil(LOCK_TIME_MS / 1000)} seconds.`);
      } else {
        showError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      hideSpinner();
      toggleForm(true);
    }
  }

  function simulateLogin(username, password) {
    return new Promise((resolve, reject) => {
      const delay = 500 + Math.random() * 800;
      setTimeout(() => {
        const token = generateToken();
        try {
          setAuthToken(token);
          resolve(token);
        } catch (e) {
          reject(new Error('Token storage error'));
        }
      }, delay);
    });
  }

  function generateToken() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => ('00' + b.toString(16)).slice(-2)).join('');
  }

  function setAuthToken(token) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${AUTH_TOKEN_KEY}=${token}; Expires=${expires}; Path=/; Secure; SameSite=Strict`;
  }

  function showSpinner() {
    const spinner = document.getElementById(SPINNER_ID);
    if (spinner) spinner.style.display = 'block';
  }

  function hideSpinner() {
    const spinner = document.getElementById(SPINNER_ID);
    if (spinner) spinner.style.display = 'none';
  }

  function showError(message) {
    const errorEl = document.getElementById(ERROR_MSG_ID);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearError() {
    const errorEl = document.getElementById(ERROR_MSG_ID);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  function toggleForm(enabled) {
    const form = document.getElementById(LOGIN_FORM_ID);
    if (!form) return;
    Array.from(form.elements).forEach(el => {
      el.disabled = !enabled;
    });
  }

  function redirectToDashboard() {
    window.location.href = '/dashboard.html';
  }

  document.addEventListener('DOMContentLoaded', initLogin);
})();
