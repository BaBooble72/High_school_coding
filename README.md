**Leopard Proxy (DogeUB v5) — Setup & Run Guide**

This project is a modern web proxy hub with a React (Vite) frontend, a small Node/Fastify server, and an optional AI chat powered via a secure server-side proxy.

Note: Do not commit secrets. Keep your `.env` local or configure env vars in your host.

**Prerequisites**
- Node.js 18+ (Node 20 LTS recommended)
- Git

**1) Get the Code**
- Clone your fork or this repo
  - `git clone <your-repo-url>`
  - `cd <repo-folder>`

**2) Install Dependencies**
- `npm install`

**3) Configure Environment**
- Create a `.env` file in the project root (server reads it via `dotenv`). Add any keys you plan to use:
  - OpenAI: `OPENAI_API_KEY=<your key>`
  - OpenRouter: `OPENROUTER_API_KEY=<your key>`
  - Google Gemini: `GEMINI_API_KEY=<your key>`
  - Groq: `GROQ_API_KEY=<your key>`

Keys are only used in `server.js` and never shipped to the browser.

- Full app (frontend + server):
  1. Build the frontend once: `npm run build`
  2. Start the server: `node server.js`
  3. Open http://localhost:2345
  4. For live UI edits while the server is running, you can rebuild in watch mode in a second terminal:
     - `npx vite build --watch`

Port note: the server listens on port 2345 (hardcoded in `server.js`). If that port is taken, stop the other process or change the code.

Advanced dev (optional): You can configure Vite to proxy backend routes to the Node server so you can use `npm run dev` for the UI while the server handles APIs. Add proxies for `/api`, `/wisp`, `/seal`, `/_uv`, `/uv`, `/_dist_uv`, `/baremux`, `/baremod`, `/epoxy` to `http://localhost:2345` in `vite.config.js`.

**5) Production**
- Build and run
  - `npm ci` (or `npm install --omit=dev`)
  - `npm run build`
  - `node server.js`
- Optional: use a process manager
  - `npm i -g pm2`
  - `pm2 start server.js --name proxy`

**AI Configuration**
- Centralized in `src/data/aiConfig.js` — set default provider, model categories, allowed models, and routing “chains” used by the server when a model is selected in the UI.
- The UI model list is also defined there and re-exported by `src/data/models.js` for the dropdown.
- The server exposes two endpoints consumed by the UI:
  - `POST /api/ai` (final-only)
  - `POST /api/ai_stream` (server‑sent events streaming)
- Providers supported by the server (pick any you have keys for): OpenAI, OpenRouter, Gemini, Groq. Missing keys simply disable that provider.

**Optional Web Search Tools**
- If you enable web search in the UI, the server may call an external search API when configured. Supported keys:
  - `SERPER_API_KEY` (preferred if present)
  - `BING_SUBSCRIPTION_KEY` (uses `BING_ENDPOINT` if provided, defaults to `https://api.bing.microsoft.com`)
  - `TAVILY_API_KEY`

**MASQR (Optional Access Wall)**
- Set `MASQR=true` to activate a simple access/license gate handled by `masqr.js`.
- Defaults expect a license server at `http://localhost:8004/validate?license=` (see `LICENSE_SERVER_URL` inside `masqr.js`). You can customize whitelist behavior and responses there.

**Deploying on Render (example)**
- Connect the repo in Render → New Web Service
- Environment: Node
- Build Command: `npm ci && npm run build`
- Start Command: `node server.js`
- Add your environment variables in the Render dashboard
- Note: the provided `render.yaml` uses `npm build`; change that to `npm run build` if you rely on it.

**Available NPM Scripts**
- `dev`: runs the Vite dev server
- `build`: builds to `dist/`
- `preview`: Vite preview of the built site (does not include the Node proxy)
- `lint`: ESLint

**Tech Notes**
- Frontend: Vite + React
- Server: Fastify with static hosting of `dist/`, Wisp websocket endpoint (`/wisp/`), Ultraviolet assets (`/_dist_uv/`, `/uv/*`), bare server (`/seal/`), and the AI proxy endpoints.
- Static assets in `public/` are copied to `dist/` on build.

**Troubleshooting**
- “API not found” during `npm run dev`: run the Node server (Option B) or add Vite proxies for `/api`, `/wisp`, `/seal`, etc.
- Port already in use on 2345: stop the conflicting process or change the port in `server.js`.
- AI says a provider is not configured: ensure the related `*_API_KEY` is present in `.env` and restart the server.

License: see `LICENSE`.
