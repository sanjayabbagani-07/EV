import test from "node:test";
import assert from "node:assert/strict";
import worker from "../Worker/index.js";

const env = {
  ALLOWED_ORIGIN: "https://sanjayabbagani-07.github.io"
};

test("GET /health returns healthy status", async () => {
  const request = new Request("https://ev.test/health");
  const response = await worker.fetch(request, env);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, "ok");
  assert.equal(data.service, "EV Worker");
});

test("unknown route returns 404", async () => {
  const request = new Request("https://ev.test/unknown", {
    headers: { Origin: env.ALLOWED_ORIGIN }
  });
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 404);
});

test("chat rejects missing API key", async () => {
  const request = new Request("https://ev.test/api/chat", {
    method: "POST",
    headers: {
      Origin: env.ALLOWED_ORIGIN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Hello" }] }]
    })
  });

  const response = await worker.fetch(request, env);
  const data = await response.json();

  assert.equal(response.status, 503);
  assert.match(data.error, /GEMINI_API_KEY/);
});

test("chat rejects malformed JSON", async () => {
  const request = new Request("https://ev.test/api/chat", {
    method: "POST",
    headers: {
      Origin: env.ALLOWED_ORIGIN,
      "Content-Type": "application/json"
    },
    body: "{invalid"
  });

  const response = await worker.fetch(request, {
    ...env,
    GEMINI_API_KEY: "test-key"
  });

  assert.equal(response.status, 400);
});
