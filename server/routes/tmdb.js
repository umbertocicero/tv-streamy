// Proxy TMDB: la API key resta sul server, i client chiamano /api/tmdb/*.
// Le risposte sono cachate in SQLite (condivise fra tutti i client) per
// ridurre le chiamate esterne e servire i dati anche se TMDB è lento.
import { Router } from "express";
import { db } from "../db.js";

export const tmdbRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY || "";
const CACHE_TTL_MS = (parseInt(process.env.TMDB_CACHE_HOURS) || 24) * 3600 * 1000;

// Whitelist dei path proxati: il client non può usare il server come proxy generico.
const ALLOWED = [
  /^\/search\/multi$/,
  /^\/trending\/(all|movie|tv)\/(day|week)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/(movie|tv)\/\d+$/,
  /^\/tv\/\d+\/season\/\d+$/,
  /^\/(movie|tv)\/\d+\/credits$/,
  /^\/genre\/(movie|tv)\/list$/,
];

const getCached = db.prepare("SELECT body, expires_at FROM tmdb_cache WHERE key = ?");
const setCached = db.prepare(`
  INSERT INTO tmdb_cache (key, body, expires_at) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET body = excluded.body, expires_at = excluded.expires_at
`);

tmdbRouter.get(/.*/, async (req, res) => {
  const tmdbPath = req.path; // path relativo al mount /api/tmdb
  if (!ALLOWED.some(re => re.test(tmdbPath))) {
    return res.status(400).json({ error: "path_not_allowed" });
  }
  if (!API_KEY) {
    return res.status(503).json({ error: "tmdb_not_configured", hint: "Imposta TMDB_API_KEY sul server" });
  }

  // Chiave cache: path + query (senza api_key, che non arriva mai dal client)
  const url = new URL(TMDB_BASE + tmdbPath);
  const passthrough = ["query", "page", "language", "sort_by", "with_genres", "year", "append_to_response"];
  for (const p of passthrough) {
    if (req.query[p] !== undefined) url.searchParams.set(p, req.query[p]);
  }
  if (!url.searchParams.has("language")) url.searchParams.set("language", "it-IT");
  const cacheKey = url.pathname + "?" + url.searchParams.toString();

  const cached = getCached.get(cacheKey);
  if (cached && cached.expires_at > Date.now()) {
    res.set("X-Cache", "HIT");
    return res.type("json").send(cached.body);
  }

  url.searchParams.set("api_key", API_KEY);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const upstream = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    const body = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).type("json").send(body);
    }
    setCached.run(cacheKey, body, Date.now() + CACHE_TTL_MS);
    res.set("X-Cache", "MISS");
    res.type("json").send(body);
  } catch (err) {
    // TMDB irraggiungibile: serve la cache scaduta se esiste (stale-while-error)
    if (cached) {
      res.set("X-Cache", "STALE");
      return res.type("json").send(cached.body);
    }
    res.status(502).json({ error: "tmdb_unreachable", detail: String(err.message || err) });
  }
});
