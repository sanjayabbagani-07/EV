const TIMEOUT_MS = 10000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`External service returned HTTP ${response.status}.`);
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("External service timed out.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function handleAgentTool(name, params) {
  if (name === "time") {
    const timezone = params.get("timezone") || "Asia/Kolkata";
    try {
      return {
        iso: new Date().toISOString(),
        timezone,
        formatted: new Intl.DateTimeFormat("en-IN", {
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "short"
        }).format(new Date())
      };
    } catch {
      throw new Error("Invalid timezone.");
    }
  }

  if (name === "news") {
    const ids = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");
    const topIds = Array.isArray(ids) ? ids.slice(0, 5) : [];
    const stories = await Promise.all(topIds.map(async id => {
      try {
        const story = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${Number(id)}.json`);
        if (!story || typeof story.title !== "string") return null;
        return {
          title: story.title.slice(0, 300),
          url: typeof story.url === "string" ? story.url : `https://news.ycombinator.com/item?id=${Number(id)}`
        };
      } catch {
        return null;
      }
    }));
    return stories.filter(Boolean);
  }

  if (name === "weather") {
    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error("Weather needs valid latitude and longitude. Ask the user before requesting device location.");
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code",
      timezone: "auto"
    }).toString();

    return await fetchJson(url.toString());
  }

  throw new Error("Unknown tool. Available tools: time, news, weather.");
}
