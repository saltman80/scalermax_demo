(function () {
  const API_URL = "/api/scalermax-api";
  const API_KEY = import.meta.env.VITE_SCALERMAX_BACKEND_KEY;

  // --- DEBUG DUMP ---
  const debugEl = document.getElementById('debug-dump');
  function dumpDebug(obj) {
    if (!debugEl) return;
    debugEl.textContent = JSON.stringify(obj, null, 2);
  }

  console.groupCollapsed('🔍 SCALERMAX DEBUG');
  console.log('VITE_SCALERMAX_BACKEND_KEY:', API_KEY);
  console.log('window.OPENROUTER_BASE_URL :', window.OPENROUTER_BASE_URL);
  console.log('window.OPENROUTER_API_KEY  :', window.OPENROUTER_API_KEY);
  console.groupEnd();

  dumpDebug({
    SCALERMAX_BACKEND_KEY: API_KEY,
    OPENROUTER_BASE_URL: window.OPENROUTER_BASE_URL,
    OPENROUTER_API_KEY: window.OPENROUTER_API_KEY,
    API_URL: API_URL,
    CLIENT_TIME: new Date().toISOString(),
  });
  // ----------------------

  if (!API_KEY) {
    console.error("❌ SCALERMAX_BACKEND_KEY not provided to client");
  }
  const REQUEST_TIMEOUT = 120000; // 2 minutes

  const MESSAGE_COOLDOWN_MS = 60000; // 1 minute

  let chatContainer, chatForm, chatInput, sendButton;
  let lastSentTime = 0;
  let scrollScheduled = false;

  document.addEventListener("DOMContentLoaded", initChat);

  function initChat() {
    chatContainer = document.getElementById("chat-container");
    chatForm = document.getElementById("chat-form");
    chatInput = document.getElementById("chat-input");
    sendButton = document.getElementById("send-button");
    if (!chatContainer || !chatForm || !chatInput || !sendButton) {
      console.error("One or more chat elements not found", {
        chatContainer,
        chatForm,
        chatInput,
        sendButton,
      });
      return;
    }
    chatContainer.setAttribute("aria-live", "polite");
    chatContainer.setAttribute("role", "log");
    sendButton.disabled = false;
    chatInput.disabled = false;
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const prompt = chatInput.value.trim();
      if (!prompt) return;
      const now = Date.now();
      if (now - lastSentTime < MESSAGE_COOLDOWN_MS) {
        renderMessage(
          "Please wait 1 minute before sending another message.",
          "system",
        );
        return;
      }
      sendPrompt(prompt);
    });
    chatInput.focus();
  }

  function scrollToBottom() {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        scrollScheduled = false;
      });
    }
  }

  function renderMessage(message, sender) {
    const el = document.createElement("div");
    let cls = "message-ai";
    if (sender === "user") cls = "message-user";
    else if (sender === "system") cls = "message-system";
    el.classList.add("message", cls);
    el.textContent = message;
    chatContainer.appendChild(el);
    scrollToBottom();
    return el;
  }

  async function sendPrompt(prompt) {
    // 🔍 DEBUG: log every possible source of the key
    console.error('🛠️ DEBUG KEYS:', {
      viteKey: API_KEY,
    });
    renderMessage(prompt, "user");
    chatInput.value = "";
    sendButton.disabled = true;
    chatInput.disabled = true;
    lastSentTime = Date.now();
    setTimeout(() => {
      sendButton.disabled = false;
      chatInput.disabled = false;
    }, MESSAGE_COOLDOWN_MS);
    const aiEl = renderMessage("", "ai");
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      await streamResponse(
        prompt,
        (chunk) => {
          aiEl.textContent += chunk;
          scrollToBottom();
        },
        controller.signal,
      );
    } catch (err) {
      if (err.name === "AbortError") {
        aiEl.textContent = "Error: Request timed out";
      } else {
        const debugData = {
          time: new Date().toISOString(),
          prompt,
          apiUrl: API_URL,
          injectedKey: API_KEY,
          clientApiKey: API_KEY,
          sentHeaders: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          rawHeaders: headers,
          errorName: err.name,
          errorMessage: err.message,
          stack: err.stack,
        };
        aiEl.textContent = '❌ Error, see debug dump below';
        const dumpEl = document.getElementById('debug-dump');
        if (dumpEl) dumpEl.textContent = JSON.stringify(debugData, null, 2);
        console.error('🛠 Full debug dump:', debugData);
        aiEl.classList.add("message-system");
      }
      scrollToBottom();
    } finally {
      clearTimeout(timeoutId);
      chatInput.focus();
    }
  }

  async function streamResponse(prompt, onData, signal) {
    console.error('DEBUG:', {
      clientApiKey: API_KEY,
    });
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ prompt }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI Server error ${res.status}: ${text}`);
    }
    if (!res.body)
      throw new Error("ReadableStream not supported in this browser.");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        onData(chunk);
      }
    }
  }
})();
