# EV — Personal AI

Original mobile-first assistant project, taking high-level inspiration from Vamshi's J.A.R.V.I.S Mobile Edition series. EV uses its own code and product design.

## Included
- Responsive chat UI with an original red/blue emblem
- Browser-local conversation history and explicit `remember:` memory
- Telugu/English speech input and device text-to-speech
- Read-only agent tools: India time, approximate-location weather, tech headlines
- Cloudflare Worker proxy; Gemini key remains server-side
- PWA shell and offline asset cache

## Enable Gemini
1. Create a Cloudflare Worker and paste `worker/index.js`.
2. Add Worker secret `GEMINI_API_KEY`.
3. Optionally set `ALLOWED_ORIGIN` to your exact GitHub Pages origin.
4. Deploy the Worker.
5. Open EV Settings and paste the Worker URL.

Never put API keys in browser code or public GitHub files.

## Deploy frontend
Enable GitHub Pages for the repository root. Open the Pages URL over HTTPS.

## Limits
Memory is stored only in this browser. Weather requires location permission. Speech support varies by browser. Agent tools are read-only and do not send messages, make purchases, or change accounts.

Reference: https://github.com/vamshi-vfx/Personal-ai-assistant
The reference build guide currently marks Episode 08, The Automation, as locked. EV is an independent implementation.
