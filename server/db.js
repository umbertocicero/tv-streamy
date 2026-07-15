// Database SQLite: schema e connessione.
// Il file di database va su un disco persistente in produzione (vedi README).
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "tvstreamy.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  -- Utenti: per ora identificati da un ID generato dal client.
  -- L'autenticazione reale si aggancerà qui (colonne email/password_hash o provider OAuth).
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL DEFAULT 'utente',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  -- Stato applicativo per la sincronizzazione multi-dispositivo:
  -- l'intero stato utente (libreria, episodi visti, rating, liste...) come documento JSON versionato.
  CREATE TABLE IF NOT EXISTS states (
    user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       TEXT NOT NULL,
    version    INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  -- Commenti sui titoli (title_id = ID TMDB o ID del catalogo).
  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username   TEXT NOT NULL,
    text       TEXT NOT NULL,
    lang       TEXT NOT NULL DEFAULT 'Italiano',
    parent_id  INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_comments_title ON comments(title_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

  CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    PRIMARY KEY (comment_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS comment_reports (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason     TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    PRIMARY KEY (comment_id, user_id)
  );

  -- Cache server-side delle risposte TMDB (riduce le chiamate e velocizza tutti i client).
  CREATE TABLE IF NOT EXISTS tmdb_cache (
    key        TEXT PRIMARY KEY,
    body       TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

// Garantisce che l'utente esista (upsert leggero, chiamato dal middleware).
const upsertUser = db.prepare(`
  INSERT INTO users (id, username) VALUES (?, ?)
  ON CONFLICT(id) DO UPDATE SET username = excluded.username
`);
export function ensureUser(id, username = "utente") {
  upsertUser.run(id, username);
}
