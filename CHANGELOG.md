# EV Upgrade Package changelog

## 2.0.0
- Adds a Cloudflare Worker chat endpoint with server-side Gemini credentials.
- Supports both the current EV Gemini `contents` history shape and the simpler `messages` contract.
- Adds time, news, and opt-in coordinate-based weather tools.
- Adds bounded request sizes, turn limits, upstream timeout, response validation, and exact-origin CORS configuration.
- Adds a local explicit-memory helper with recall, forget, export, and import.
- Leaves the current EV UI unchanged to avoid breaking its inline implementation.
