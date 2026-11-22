# EV Upgrade Package — safe integration

This package adds a secure Worker API, a small agent-tool registry, a browser helper, and explicit local memory. It does **not** replace your current EV `index.html`, `styles.css`, or visual interface.

## Important compatibility note

Your current repository has two frontend implementations:
- `index.html` contains the live, self-contained EV interface and its own inline JavaScript.
- `app.js` expects a different DOM (`#messages`, `#history`, `#message`, etc.) and is not currently loaded by that `index.html`.

Do not add `app.js` as a script to the current page without reconciling the DOM. This package intentionally leaves that UI untouched.

## 1. Add these files

Copy the package files into your repository:
- Replace `Worker/index.js` with this package's `Worker/index.js`.
- Add `Worker/lib/agent.js`.
- Add `Worker/wrangler.toml.example` (rename to `wrangler.toml` only if you use Wrangler).
- Add `frontend/ev-worker-client.js`.
- Replace `memory.js` only if you want the v2 memory API; export your existing memory first if it contains anything important.

## 2. Configure and deploy the Cloudflare Worker

In Cloudflare Worker settings:
- Add secret `GEMINI_API_KEY` using the Secrets section.
- Add variable `ALLOWED_ORIGIN` set to your exact GitHub Pages origin, e.g. `https://YOUR-USERNAME.github.io`.
- Optionally set `GEMINI_MODEL` to a model enabled for your Google AI Studio project.

Do not put the Gemini key in `index.html`, `app.js`, GitHub, or any public file.

If using Wrangler:
1. Install Node.js and Wrangler on a computer.
2. From the `Worker` folder, run `npx wrangler secret put GEMINI_API_KEY`.
3. Deploy with `npx wrangler deploy`.

If you only have Android, use the Cloudflare dashboard editor to create/update the Worker and add the `lib/agent.js` module file. Ensure the Worker is configured for ES modules.

## 3. Connect the current EV page

Add this script immediately before the existing inline `<script>` in `index.html`:

```html
<script src="./frontend/ev-worker-client.js"></script>
```

Inside the existing inline script, define the deployed Worker URL:

```js
const EV_WORKER_URL = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";
```

In the existing `ask(q)` function:
- Remove the call to `getApiKey()` and the check for a Gemini key.
- Keep the existing `history` array and user-message rendering.
- Replace the direct Google `fetch(ENDPOINT, ...)` call with:

```js
const result = await EVWorkerClient.chat({
  workerUrl: EV_WORKER_URL,
  contents: history,
  hero: HERO,
  signal: controller.signal
});
const answer = String(result.reply || "").trim();
if (!answer) throw new Error("EV Worker returned an empty reply.");
```

- Remove the old direct-Gemini response parsing (`readReply(data)`) and use `answer` above.
- Remove the `x-goog-api-key` header and do not request/store a key in the browser.
- Keep the existing `history.push({ role: "model", parts: [{ text: answer }] })` after a successful response.

The old API-key dialog can be removed from the HTML after confirming the Worker connection works. Until then, leave it in place but do not use it.

## 4. Agent tools

The Worker exposes:
- `GET /health`
- `GET /api/tools/time?timezone=Asia%2FKolkata`
- `GET /api/tools/news`
- `GET /api/tools/weather?lat=...&lon=...`

Weather requires coordinates. Ask the user before requesting browser location. Never silently request location.

Example browser call:

```js
const result = await EVWorkerClient.tool({
  workerUrl: EV_WORKER_URL,
  name: "time",
  params: { timezone: "Asia/Kolkata" }
});
```

The tools return data only. They do not send messages, change files, create reminders, or perform actions on the user's behalf.

## 5. Explicit memory

Load `memory.js` before the inline application script:

```html
<script src="./memory.js"></script>
```

Examples:

```js
EVMemory.remember("I prefer concise answers.", "preferences");
EVMemory.recall();             // all saved items
EVMemory.recall("preferences"); // filtered items
EVMemory.forget("preferences"); // remove matching items
EVMemory.forget("all");         // clear all EV v2 memories
```

Memory is local to this browser profile. It is not encrypted, synced, or shared across devices. Do not save passwords, API keys, or other secrets.

## 6. Smoke checks

After deployment:
- Open `https://YOUR-WORKER.../health`; expect JSON with `ok: true`.
- Open EV and send a simple chat message.
- Confirm the browser Network panel shows requests to your Worker, not directly to `generativelanguage.googleapis.com`.
- Confirm no Gemini key is present in page source, localStorage, or Git history.
- Test time and news tools.
- Test weather only after explicitly granting location permission.
- Test Telugu and English voice using the existing EV voice controls.

## Limits

This is a carefully scoped foundation, not a claim that every feature of the GrowthOS project has been reproduced. It does not yet include autonomous device control, Android accessibility automation, camera vision, calendar integration, cloud-synced memory, or a multi-agent planner. Those need separate permissioned integrations and testing.
