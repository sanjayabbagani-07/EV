/* EV explicit local memory. No cloud sync; data stays in this browser profile. */
(function (global) {
  "use strict";

  const KEY = "ev_memory_v2";
  const LIMIT = 100;
  const MAX_TEXT = 500;

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(parsed)
        ? parsed.filter(x => x && typeof x.text === "string").slice(-LIMIT)
        : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-LIMIT)));
      return true;
    } catch {
      return false;
    }
  }

  function remember(text, category) {
    const clean = String(text || "").trim().replace(/\s+/g, " ").slice(0, MAX_TEXT);
    if (!clean) return { ok: false, message: "Tell EV what to remember." };

    const items = read();
    if (items.some(x => x.text.toLowerCase() === clean.toLowerCase())) {
      return { ok: true, duplicate: true, message: "That memory is already saved." };
    }

    items.push({
      id: (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      text: clean,
      category: String(category || "general").slice(0, 40),
      createdAt: new Date().toISOString()
    });

    const ok = write(items);
    return { ok, message: ok ? "Saved on this device." : "Could not save memory. Browser storage may be full or disabled." };
  }

  function recall(query) {
    const q = String(query || "").trim().toLowerCase();
    const items = read();
    if (!q) return items;
    return items.filter(x => x.text.toLowerCase().includes(q) || x.category.toLowerCase().includes(q));
  }

  function forget(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q || q === "all") {
      return { ok: write([]), removed: "all" };
    }
    const items = read();
    const kept = items.filter(x => !x.text.toLowerCase().includes(q) && !x.category.toLowerCase().includes(q));
    const removed = items.length - kept.length;
    return { ok: write(kept), removed };
  }

  function exportData() {
    return JSON.stringify(read(), null, 2);
  }

  function importData(jsonText) {
    let incoming;
    try {
      incoming = JSON.parse(jsonText);
    } catch {
      return { ok: false, message: "Invalid JSON file." };
    }
    if (!Array.isArray(incoming)) return { ok: false, message: "Memory backup must be a JSON array." };

    const merged = read();
    for (const item of incoming.slice(-LIMIT)) {
      if (item && typeof item.text === "string" &&
          !merged.some(x => x.text.toLowerCase() === item.text.toLowerCase())) {
        merged.push({
          id: String(item.id || Date.now() + Math.random()),
          text: item.text.slice(0, MAX_TEXT),
          category: String(item.category || "general").slice(0, 40),
          createdAt: String(item.createdAt || new Date().toISOString())
        });
      }
    }
    const ok = write(merged);
    return { ok, message: ok ? "Memory backup imported." : "Could not write imported memories." };
  }

  global.EVMemory = Object.freeze({ remember, recall, forget, exportData, importData });
})(window);
