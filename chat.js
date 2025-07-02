(function() {
    const API_URL = '/api/chat';
    const REQUEST_TIMEOUT = 120000; // 2 minutes

    let chatContainer, chatForm, chatInput, sendButton;
    let scrollScheduled = false;

    document.addEventListener('DOMContentLoaded', initChat);

    function initChat() {
        chatContainer = document.getElementById('chat-container');
        chatForm = document.getElementById('chat-form');
        chatInput = document.getElementById('chat-input');
        sendButton = document.getElementById('send-button');
        if (!chatContainer || !chatForm || !chatInput || !sendButton) {
            console.error('One or more chat elements not found', { chatContainer, chatForm, chatInput, sendButton });
            return;
        }
        chatContainer.setAttribute('aria-live', 'polite');
        chatContainer.setAttribute('role', 'log');
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatForm.addEventListener('submit', e => {
            e.preventDefault();
            const prompt = chatInput.value.trim();
            if (!prompt) return;
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
        const el = document.createElement('div');
        el.classList.add('message', sender === 'user' ? 'message-user' : 'message-ai');
        el.textContent = message;
        chatContainer.appendChild(el);
        scrollToBottom();
        return el;
    }

    async function sendPrompt(prompt) {
        renderMessage(prompt, 'user');
        chatInput.value = '';
        sendButton.disabled = true;
        chatInput.disabled = true;
        const aiEl = renderMessage('', 'ai');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        try {
            await streamResponse(prompt, chunk => {
                aiEl.textContent += chunk;
                scrollToBottom();
            }, controller.signal);
        } catch (err) {
            if (err.name === 'AbortError') {
                aiEl.textContent = 'Error: Request timed out';
            } else {
                aiEl.textContent = 'Error: ' + err.message;
            }
            scrollToBottom();
        } finally {
            clearTimeout(timeoutId);
            sendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    async function streamResponse(prompt, onData, signal) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal
        });
        if (!res.ok) throw new Error(res.statusText || 'Network response was not ok');
        if (!res.body) throw new Error('ReadableStream not supported in this browser.');
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