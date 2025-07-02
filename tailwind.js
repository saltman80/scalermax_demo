const fsSync = require('fs');
const fs = fsSync.promises;
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const { PurgeCSS } = require('purgecss');

const ALLOWED_OUTPUT_DIR = path.resolve(process.cwd(), 'dist');

function sanitizeOutputPath(potentialPath) {
  const resolved = path.resolve(potentialPath);
  if (resolved !== ALLOWED_OUTPUT_DIR && !resolved.startsWith(ALLOWED_OUTPUT_DIR + path.sep)) {
    throw new Error(`Output path "${potentialPath}" is outside of allowed directory "${ALLOWED_OUTPUT_DIR}"`);
  }
  return resolved;
}

async function configureTailwind(config) {
  const inputCss = [
    '@tailwind base;',
    '@tailwind components;',
    '@tailwind utilities;'
  ].join('\n');
  const outputPath = sanitizeOutputPath(config.output || 'dist/css/tailwind.css');
  const { output, ...pluginConfig } = config;
  const result = await postcss([
    tailwindcss(pluginConfig),
    autoprefixer()
  ]).process(inputCss, { from: undefined, to: outputPath });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.css, 'utf8');
  if (result.map) {
    await fs.writeFile(`${outputPath}.map`, result.map.toString(), 'utf8');
  }
  return outputPath;
}

async function purgeUnusedCSS(paths, cssFile, options = {}) {
  const purgeResult = await new PurgeCSS().purge({
    content: paths,
    css: [cssFile],
    ...options
  });
  const purified = purgeResult.map(item => item.css).join('');
  const outputPath = sanitizeOutputPath(options.output || cssFile);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, purified, 'utf8');
  return outputPath;
}

async function build() {
  const jsonConfigPath = path.resolve('tailwind.config.json');
  let tailwindConfig;
  if (fsSync.existsSync(jsonConfigPath)) {
    const raw = await fs.readFile(jsonConfigPath, 'utf8');
    try {
      tailwindConfig = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in tailwind.config.json: ${err.message}`);
    }
    if (typeof tailwindConfig !== 'object' || tailwindConfig === null) {
      throw new Error('tailwind.config.json must export an object');
    }
    if (!Array.isArray(tailwindConfig.content)) {
      throw new Error('tailwind.config.json must include a "content" array');
    }
  } else {
    tailwindConfig = {
      content: ['src/**/*.{html,js,jsx,ts,tsx}'],
      theme: { extend: {} },
      plugins: []
    };
  }
  const config = { ...tailwindConfig, output: 'dist/css/tailwind.css' };
  const cssFile = await configureTailwind(config);
  await purgeUnusedCSS(config.content, cssFile, { output: 'dist/css/styles.css' });
}

if (require.main === module) {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { configureTailwind, purgeUnusedCSS };