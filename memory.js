/* EV explicit, device-local memory.
   Memories are stored in this browser's localStorage and are not synced to a server. */
(function (global) {
  "use strict";

  const KEY = "ev_memory_v1";
  const LIMIT = 100;
  const MAX_TEXT = 500;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(value)
        ? value.filter(item => item && typeof item.text === "string").slice(-LIMIT)
        : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-LIMIT)));
  }

  function remember(text) {
    const clean = String(text || "").trim().replace(/\s+/g, " ").slice(0, MAX_TEXT);
    if (!clean) return "Tell me what you want me to remember.";

    const items = read();
    if (items.some(item => item.text.toLowerCase() === clean.toLowerCase())) {
      return "I already have that saved in this browser.";
    }

    items.push({ text: clean, savedAt: new Date().toISOString() });
    write(items);
    return "Saved to EV memory on this device. I'll use it as context in future chats.";
  }

  function forget(query) {
    const cleanQuery = String(query || "").trim().toLowerCase();

    if (!cleanQuery || /^(all|everything|all memories)$/.test(cleanQuery)) {
      write([]);
      return "All EV memories saved on this device have been cleared.";
    }

    const items = read();
    const kept = items.filter(item => !item.text.toLowerCase().includes(cleanQuery));

    if (kept.length === items.length) {
      return "I couldn't find a saved memory matching that.";
    }

    write(kept);
    return "Removed " + (items.length - kept.length) + " matching memory item(s).";
  }

  function handle(message) {
    const text = String(message || "").trim();
    let match = text.match(/^remember(?: that)?\s*[:,-]?\s*(.+)$/i);

    if (match) {
      return { reply: remember(match[1]), action: "remember" };
    }

    if (/^(what do you remember|what do you remember about me|recall memories|show my memories)$/i.test(text)) {
      const items = read();
      return {
        reply: items.length
          ? "Here's what I have saved on this device:\n" +
            items.map((item, index) => (index + 1) + ". " + item.text).join("\n")
          : "I don't have any saved memories on this device yet.",
        action: "recall"
      };
    }

    match = text.match(/^forget(?: that)?\s*[:,-]?\s*(.*)$/i);
    if (match) {
      return { reply: forget(match[1]), action: "forget" };
    }

    return null;
  }

  function context() {
    return read()
      .map((item, index) => (index + 1) + ". " + item.text)
      .join("\n");
  }

  global.EVMemory = Object.freeze({ handle, context });
})(window);
