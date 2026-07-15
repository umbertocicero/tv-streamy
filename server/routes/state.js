// Sync multi-dispositivo: l'intero stato utente come documento JSON versionato.
// Ogni dispositivo invia la propria versione; il server accetta solo scritture
// basate sulla versione corrente (optimistic concurrency). In caso di conflitto
// risponde 409 con lo stato remoto, e il client decide come riconciliare.
import { Router } from "express";
import { db } from "../db.js";

export const stateRouter = Router();

const getState = db.prepare("SELECT data, version, updated_at FROM states WHERE user_id = ?");
const insertState = db.prepare(
  "INSERT INTO states (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)"
);
const updateState = db.prepare(`
  UPDATE states SET data = ?, version = version + 1, updated_at = ?
  WHERE user_id = ? AND version = ?
`);

// GET /api/state → stato corrente (404 se il dispositivo non ha mai sincronizzato)
stateRouter.get("/", (req, res) => {
  const row = getState.get(req.userId);
  if (!row) return res.status(404).json({ error: "no_state" });
  res.json({ data: JSON.parse(row.data), version: row.version, updatedAt: row.updated_at });
});

// PUT /api/state { data, baseVersion } → salva; 409 se un altro dispositivo ha scritto nel frattempo
stateRouter.put("/", (req, res) => {
  const { data, baseVersion } = req.body || {};
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "missing_data" });
  }

  const now = Date.now();
  const existing = getState.get(req.userId);

  if (!existing) {
    insertState.run(req.userId, JSON.stringify(data), now);
    return res.json({ version: 1, updatedAt: now });
  }

  const result = updateState.run(JSON.stringify(data), now, req.userId, baseVersion ?? existing.version);
  if (result.changes === 0) {
    // Conflitto: un altro dispositivo ha scritto. Restituisce lo stato remoto.
    const remote = getState.get(req.userId);
    return res.status(409).json({
      error: "version_conflict",
      remote: { data: JSON.parse(remote.data), version: remote.version, updatedAt: remote.updated_at },
    });
  }
  res.json({ version: (baseVersion ?? existing.version) + 1, updatedAt: now });
});

// DELETE /api/state → eliminazione account/dati (usata da "Elimina account")
stateRouter.delete("/", (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.userId);
  res.json({ ok: true });
});
