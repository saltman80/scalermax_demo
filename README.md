# scalermax_demo

**ScalerMax ? Netlify Backend API + Admin Dashboard**

---

## Table of Contents

- [Description](#description)
- [Overview](#overview)
- [Architecture](#architecture)
- [Flow](#flow)
  - [API Flow](#api-flow)
  - [Admin UI Flow](#admin-ui-flow)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [AI Chat Endpoint](#ai-chat-endpoint)
  - [Admin Dashboard](#admin-dashboard)
- [Components](#components)
- [Dependencies](#dependencies)
- [Features](#features)
- [Not Included](#not-included)
- [Contributing](#contributing)
- [License](#license)

---

## Description

ScalerMax is a demo-ready AI Intent Server deployed on Netlify. It classifies user prompts with a lightweight model (`openai/4o-mini`), routes them dynamically via OpenRouter to the optimal LLM (`openai/o4-mini-high`), and presents a static, animated admin dashboard with fake usage metrics.

---

## Overview

- **API**: Serverless endpoint at `/.netlify/functions/scalermax-api`
- **Intent Classification**: Uses `openai/4o-mini`
- **Execution Model**: `openai/o4-mini-high`
- **Hosting**: Netlify Functions (Node.js), static admin UI
- **Admin UI**: Dark-themed HTML/CSS/JS with glowing cards, animated charts, and fake metrics

---

## Architecture

- **Static Files** at project root:
  - `admin.html`, `dashboard.html`, `styles.css`, `dashboard.js`, `glow.js`, `utils.js`, `chartIntegration.js`, `sidebar.js`
- **Serverless Functions**:
  - `netlify/functions/scalermax-api.js` (wrapper entrypoint)
  - Supporting modules (`scalermax-api.js`, `modelClassifier.js`, `modelSelector.js`, `openrouterClient.js`, `config.js`, `logger.js`, `errorHandler.js`)

---

## Flow

### API Flow

1. Client POSTs `{ "prompt": "..." }` to `/.netlify/functions/scalermax-api`
2. `scalermax-api.js` loads config & logs request
3. `scalermax-api.js` classifies the prompt as `planning` or `coding`
4. The API selects `openai/4o-mini` for planning or `openai/o4-mini-high` for coding
5. `openrouterClient.js` sends the prompt to OpenRouter, receives LLM response
6. Response is logged and returned as `{ "output": "..." }`

### Admin UI Flow

1. User visits `admin.html` and submits any credentials
2. Page shows loading, then redirects to `dashboard.html`
3. `sidebar.js` renders navigation
4. `dashboard.js`, `glow.js`, `utils.js`, and `chartIntegration.js` generate animated counters, charts, and glowing cards

---

## Installation

1. Clone the repo
   ```bash
   git clone https://github.com/your-org/scalermax_demo.git
   cd scalermax_demo
   ```
2. (Optional) Install Netlify CLI for local testing
   ```bash
   npm install netlify-cli -g
   ```
3. Deploy to Netlify
   - Connect this repo to your Netlify account
   - Ensure `netlify/functions` is set as your Functions directory in `netlify.toml`
   - Add `OPENROUTER_API_KEY` in **Site Settings → Environment Variables**

---

## Configuration

- `openrouterClient.js` now relies solely on the `OPENROUTER_API_KEY` environment variable.
- `scalermax-api.js` authenticates requests using `SCALERMAX_BACKEND_KEY`.
- Set these variables before running the demo:
```
OPENROUTER_API_KEY=your_openrouter_key
SCALERMAX_BACKEND_KEY=your_backend_key
OPENROUTER_BASE_URL=https://openrouter.ai # optional
```
  or edit `netlify/functions/config.js` to load from `process.env.OPENROUTER_API_KEY`.

When building the frontend, the `SCALERMAX_BACKEND_KEY` value is injected into
`dashboard.html`. The build script automatically replaces the placeholder
`{{SCALERMAX_BACKEND_KEY}}` with the value from your environment. Ensure this
variable is set before running `npm run build` or deploying to Netlify.

---

## Usage

### AI Chat Endpoint

```bash
curl -X POST https://<your-site>.netlify.app/.netlify/functions/scalermax-api \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a unit test for my React component"}'
```

Response:

```json
{
  "output": "Here?s a Jest test suite for your React component..."
}
```

### Admin Dashboard

1. Open `https://<your-site>.netlify.app/admin.html`
2. Enter any email/password ? click **Login**
3. Watch the glowing, animated `dashboard.html` with fake metrics

---

## Components

- **netlify.toml**  
  Netlify configuration (functions directory).
- **netlify/functions/scalermax-api.js**  
  Entrypoint: handles requests, classification, routing, response.
- **netlify/functions/modelClassifier.js**
  Uses `openai/4o-mini` to classify prompt intent.
- **netlify/functions/modelSelector.js**  
  Chooses execution model based on intent.
- **openrouterclient.js**
  Sends requests to OpenRouter using the API key from environment variables.
- **netlify/functions/config.js**  
  Loads and validates environment-driven configuration.
- **netlify/functions/logger.js**  
  Logs requests, responses, and errors.
- **netlify/functions/errorHandler.js**  
  Formats and returns standardized error responses.
- **admin.html**  
  Static login page (accepts any credentials).
- **dashboard.html**  
  Animated admin dashboard with glowing cards & charts.
- **styles.css**  
  Dark theme, neon-purple glow styling.
- **dashboard.js**  
  Initializes counters and charts with fake data.
- **glow.js**  
  Applies hover, glow, and pulse visual effects.
- **utils.js**  
  Helpers: random metrics, fake names, animation timing.
- **chartIntegration.js**  
  Encapsulates Chart.js setup and updates.
- **sidebar.js**  
  Renders the responsive navigation sidebar.

---

## Dependencies

- Netlify (Hosting & Functions)
- Node.js (?14) for serverless functions
- Chart.js (for admin charts)
- TailwindCSS or custom CSS (optional)
- Netlify CLI (local development)

---

## Features

? Serverless AI intent routing on Netlify Functions  
? Lightweight classification with openai/4o-mini
? Dynamic routing to openai/o4-mini-high for ?coding? prompts
? Static admin UI with glowing, animated metrics  
? Zero build step?deploy static files & functions directly

---

## Not Included

? Real user authentication  
? Database or persistent storage  
? Real-time metrics or logging dashboard  
? Session handling, rate limiting, retries

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -m "feat: add foo"`)
4. Push to the branch (`git push origin feature/foo`)
5. Open a Pull Request

---

## UX Guidance

The interface uses a glowing dark theme built with purples and indigos. All pages rely on modern sans-serif fonts and every button or card casts a soft shadow. Hover states trigger glow effects using `glow.js` while animations are reserved for key moments like hero entrances, card fade-ins and metric pulses. Layouts adapt to mobile with collapsible navigation and smooth sidebar transitions.

---

## License

MIT ? [Your Name or Organization]
