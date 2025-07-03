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
  const placeholder = '{{SCALERMAX_BACKEND_KEY}}';
  if (!content.includes(placeholder)) {
    console.warn('Placeholder not found in dashboard.html');
  } else {
    content = content.replace(placeholder, key);
    fs.writeFileSync(htmlFile, content);
    console.log('Injected SCALERMAX_BACKEND_KEY into dashboard.html');
  }
} catch (err) {
  console.error('Failed to inject key:', err);
  process.exit(1);
}
