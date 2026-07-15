// TV Streamy — backend Express.
// Servizi: sync stato multi-dispositivo, commenti persistenti, proxy TMDB.
// In produzione serve anche il frontend compilato (dist/): un solo deploy.
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ensureUser } from "./db.js";
import { stateRouter } from "./routes/state.js";
import { commentsRouter } from "./routes/comments.js";
import { tmdbRouter } from "./routes/tmdb.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rotte pubbliche (nessuna identità richiesta): health check e dati TMDB.
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/tmdb", tmdbRouter);

// Identità: finché non c'è l'autenticazione vera, il client si identifica con
// un ID generato sul dispositivo (header X-User-Id) + username visualizzato.
// Il login reale sostituirà questo middleware con la verifica di un token.
app.use("/api", (req, res, next) => {
  const userId = (req.get("X-User-Id") || "").trim();
  if (!/^[\w-]{8,64}$/.test(userId)) {
    return res.status(401).json({ error: "missing_user_id", hint: "Header X-User-Id richiesto" });
  }
  req.userId = userId;
  req.username = (req.get("X-Username") || "utente").slice(0, 40) || "utente";
  ensureUser(req.userId, req.username);
  next();
});

app.use("/api/state", stateRouter);
app.use("/api", commentsRouter);

// Frontend statico (build Vite) — SPA fallback su index.html
const DIST = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`TV Streamy backend su http://localhost:${PORT}`);
  if (!process.env.TMDB_API_KEY) {
    console.warn("⚠️  TMDB_API_KEY non impostata: /api/tmdb risponderà 503 (il client usa il fallback mock).");
  }
});
