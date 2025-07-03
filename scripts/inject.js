const fs = require('fs');
const path = require('path');

// point at the built output, not the source file
const htmlFile = path.join(__dirname, '..', 'dist', 'dashboard.html');

const key = process.env.SCALERMAX_BACKEND_KEY;

if (!key) {
  console.error('SCALERMAX_BACKEND_KEY is not set in environment');
  process.exit(1);
}

try {
  let content = fs.readFileSync(htmlFile, 'utf8');
  let replaced = false;

  // unify on a single placeholder
  const placeholders = ['{{SCALERMAX_BACKEND_KEY}}'];

  for (const ph of placeholders) {
    if (content.includes(ph)) {
      content = content.replace(new RegExp(ph, 'g'), key);
      replaced = true;
    }
  }

  if (replaced) {
    fs.writeFileSync(htmlFile, content);
    console.log('Injected SCALERMAX_BACKEND_KEY into dashboard.html');
  } else {
    console.warn('Placeholders not found in dashboard.html');
  }

  // -------- inject into chat.js so API_KEY literal gets replaced too
  const chatFile = path.join(__dirname, '..', 'dist', 'chat.js');
  let chatContent = fs.readFileSync(chatFile, 'utf8');
  let chatReplaced = false;
  for (const ph of placeholders) {
    if (chatContent.includes(ph)) {
      chatContent = chatContent.replace(new RegExp(ph, 'g'), key);
      chatReplaced = true;
    }
  }
  if (chatReplaced) {
    fs.writeFileSync(chatFile, chatContent);
    console.log('Injected SCALERMAX_BACKEND_KEY into chat.js');
  } else {
    console.warn('Placeholder not found in chat.js');
  }
} catch (err) {
  console.error('Failed to inject key:', err);
  process.exit(1);
}
