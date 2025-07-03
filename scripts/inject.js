const fs = require('fs');
const path = require('path');

const htmlFile = path.join(__dirname, '..', 'dashboard.html');
const key = process.env.SCALERMAX_BACKEND_KEY;

if (!key) {
  console.error('SCALERMAX_BACKEND_KEY is not set in environment');
  process.exit(1);
}

try {
  let content = fs.readFileSync(htmlFile, 'utf8');
  const placeholders = [
    '{{SCALERMAX_BACKEND_KEY}}',
    '{{ process.env.SCALERMAX_BACKEND_KEY }}'
  ];
  let replaced = false;
  for (const ph of placeholders) {
    if (content.includes(ph)) {
      content = content.replace(ph, key);
      replaced = true;
    }
  }
  if (replaced) {
    fs.writeFileSync(htmlFile, content);
    console.log('Injected SCALERMAX_BACKEND_KEY into dashboard.html');
  } else {
    console.warn('Placeholder not found in dashboard.html');
  }
} catch (err) {
  console.error('Failed to inject key:', err);
  process.exit(1);
}
