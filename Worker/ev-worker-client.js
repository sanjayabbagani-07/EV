/* Optional browser helper for EV's existing single-file interface.
   Load this file after the HTML, then call EVWorkerClient.chat(...). */
(function (global) {
  "use strict";

  function normalizeBase(url) {
    const value = String(url || "").trim().replace(/\/+$/, "");
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(value)) {
      throw new Error("Set a valid HTTPS Cloudflare Worker URL.");
    }
    return value;
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  async function chat(config) {
    const base = normalizeBase(config.workerUrl);
    const body = {
      contents: config.contents,
      context: config.context || "",
      hero: config.hero || "Sanjay",
      now: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
    };
    return request(base + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: config.signal
    });
  }

  async function tool(config) {
    const base = normalizeBase(config.workerUrl);
    const name = String(config.name || "");
    if (!["time", "news", "weather"].includes(name)) {
      throw new Error("Unsupported EV tool.");
    }
    const params = new URLSearchParams(config.params || {});
    return request(base + "/api/tools/" + name + "?" + params.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: config.signal
    });
  }

  global.EVWorkerClient = Object.freeze({ chat, tool });
})(window);
