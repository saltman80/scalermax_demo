const fs = require('fs');
const path = require('path');

const htmlFile = path.join(__dirname, '..', 'dashboard.html');

const envVars = {
  SCALERMAX_BACKEND_KEY: process.env.SCALERMAX_BACKEND_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
};

if (!envVars.SCALERMAX_BACKEND_KEY) {
  console.error('SCALERMAX_BACKEND_KEY is not set in environment');
  process.exit(1);
}

try {
  let content = fs.readFileSync(htmlFile, 'utf8');
  let replaced = false;

  for (const [envKey, value] of Object.entries(envVars)) {
    const placeholders = [
      `{{${envKey}}}`,
      `{{ process.env.${envKey} }}`,
    ];

    for (const ph of placeholders) {
      if (content.includes(ph)) {
        content = content.replace(ph, value || '');
        replaced = true;
      }
    }
  }

  if (replaced) {
    fs.writeFileSync(htmlFile, content);
    console.log('Injected environment variables into dashboard.html');
  } else {
    console.warn('Placeholders not found in dashboard.html');
  }
} catch (err) {
  console.error('Failed to inject key:', err);
  process.exit(1);
}
