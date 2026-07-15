# TV Streamy

Web app social per tracciare la visione di serie TV e film — un clone di TV Time che "prova a rinascere dalle sue ceneri". SPA React mobile-first (dark theme, accento giallo) + backend Node/Express con SQLite: catalogo reale da TMDB, commenti persistenti condivisi e sincronizzazione multi-dispositivo. L'autenticazione vera arriverà in seguito; per ora i dispositivi si identificano con un codice di sincronizzazione.

## Cosa fa

- **Catalogo reale da TMDB**: trending, ricerca, dettagli, cast, episodi e poster arrivano da [The Movie Database](https://www.themoviedb.org) attraverso il proxy del backend (la API key non è mai esposta al client). Cache server-side in SQLite + cache client (IndexedDB) + fallback a un catalogo mock se il servizio è irraggiungibile.
- **Sincronizzazione multi-dispositivo**: libreria, episodi visti, rating, reazioni, liste e impostazioni sono salvati sul server come documento versionato. Pull all'avvio, push automatico con debounce, risoluzione dei conflitti (ultimo che scrive vince, con rilevamento via versione). In Impostazioni → Sincronizzazione trovi il codice del dispositivo da inserire su un altro device per ritrovare la stessa libreria.
- **Commenti reali e condivisi**: thread per titolo persistiti in SQLite, con like, risposte annidate, segnalazioni, filtro per lingua e cancellazione dei propri commenti. Barriera anti-spoiler per i titoli non visti.
- **Serie**: watchlist con avanzamento episodio per episodio (`S01 | E01 +N`), badge di stato, check "visto", tab "In arrivo".
- **Film**: libreria personale divisa in "Da vedere" e "Visti".
- **Esplora**: feed a card, sezione "Scopri" con filtri (Trending / Most added, generi), ricerca TMDB con debounce.
- **Dettaglio titolo**: hero, generi, tab **Info** (rating, trama, trailer, cast, episodi, correlati, sondaggio, commenti) e tab **Altro** (dove l'hai visto, rating a 5 stelle, reazioni emoji).
- **Liste personalizzate**, **profilo** con contatori e scaffali, **statistiche** (tempo di visione, grafici, backlog, medaglie), **impostazioni** complete.

La specifica funzionale completa è in [`docs/PROMPT.md`](docs/PROMPT.md).

## Stack

| Livello | Scelta | Perché |
| --- | --- | --- |
| UI | React 18 + Vite | componenti funzione + hook; bundle statico con base relativa |
| Stato client | Context + `useState` | un solo store persistito in `localStorage` (offline-first) e sincronizzato col backend |
| Backend | Node 20+ / Express 5 | API REST minimale: stato, commenti, proxy TMDB; serve anche il frontend compilato |
| Database | SQLite (`better-sqlite3`) | zero amministrazione, un file su disco persistente; WAL mode |
| Dati esterni | TMDB API (free) | 900k+ titoli e poster via CDN; key solo server-side |
| Identità | header `X-User-Id` (codice dispositivo) | placeholder esplicito: il middleware verrà sostituito dal login reale |

## Architettura

```
tv-streamy/
├── server/                     # backend Express
│   ├── index.js                # app: middleware identità, rotte, static dist/
│   ├── db.js                   # schema SQLite (users, states, comments, likes, reports, tmdb_cache)
│   └── routes/
│       ├── state.js            # GET/PUT/DELETE /api/state — sync versionato multi-dispositivo
│       ├── comments.js         # /api/titles/:id/comments, like, reply, report, delete
│       └── tmdb.js             # proxy whitelisted /api/tmdb/* con cache SQLite
├── src/
│   ├── api/
│   │   ├── backend.js          # client REST + gestione codice dispositivo
│   │   └── tmdb.js             # client TMDB (passa dal proxy, rate-limited)
│   ├── data/                   # dataService (orchestrator API+cache+fallback), cache IndexedDB, catalogo mock
│   ├── hooks/                  # useTitle, useCatalog, useSearch
│   ├── state/                  # AppStateContext (store + sync), NavContext, ToastContext
│   ├── components/             # layout, common, modals
│   └── pages/                  # 13 schermate
├── Dockerfile                  # immagine unica frontend+backend
└── docs/                       # PROMPT.md (specifica), SETUP_TMDB.md
```

Flusso dati: le viste leggono selettori puri dallo store; lo store persiste in `localStorage` e sincronizza col backend (debounce 1,2 s, conflitti gestiti a versione). I metadati passano da `dataService`: memoria → IndexedDB → `/api/tmdb` (cache SQLite server) → TMDB; se tutto fallisce, catalogo mock. **L'app funziona anche senza backend**: resta locale e i commenti diventano dimostrativi in sola lettura.

## API del backend

Tutte le rotte (tranne `/api/health` e `/api/tmdb/*`) richiedono l'header `X-User-Id` (8-64 caratteri alfanumerici) e accettano `X-Username` opzionale.

| Metodo | Rotta | Descrizione |
| --- | --- | --- |
| GET | `/api/health` | stato del servizio |
| GET/PUT/DELETE | `/api/state` | stato utente versionato (PUT: `{data, baseVersion}` → 409 su conflitto) |
| GET/POST | `/api/titles/:id/comments` | lista (`?langs=`) / nuovo commento `{text, lang?, parentId?}` |
| GET | `/api/comments/:id/replies` | risposte a un commento |
| POST | `/api/comments/:id/like` | toggle like |
| POST | `/api/comments/:id/report` | segnalazione |
| DELETE | `/api/comments/:id` | cancella (solo propri) |
| GET | `/api/tmdb/*` | proxy TMDB whitelisted con cache |

## Come si avvia (sviluppo)

Prerequisiti: Node.js ≥ 20. Registra una API key TMDB gratuita (5 minuti): <https://www.themoviedb.org/settings/api> — senza key l'app usa il catalogo mock.

```bash
npm install
cp .env.example .env.local          # e inserisci TMDB_API_KEY

# terminale 1 — backend su :3001 (SQLite in ./data/)
TMDB_API_KEY=la_tua_key npm run dev:server

# terminale 2 — frontend Vite su :5173 (proxa /api verso :3001)
npm run dev
```

## Come si builda

```bash
npm run build      # bundle statico in dist/
npm start          # build + server unico su :3001 (API + frontend)
```

In produzione **basta il solo processo Node**: Express serve `dist/` e le API dallo stesso dominio, quindi niente CORS né configurazioni extra.

## Dove e come si deploya

Il backend ha bisogno di un **filesystem persistente** per SQLite (`DATA_DIR`). Variabili d'ambiente: `TMDB_API_KEY` (obbligatoria per il catalogo reale), `DATA_DIR`, `PORT` (di solito impostata dalla piattaforma).

### Render (consigliata: free tier + dischi persistenti)
1. New → **Web Service** → collega il repo.
2. Build command `npm install && npm run build`, start command `node server/index.js`.
3. Aggiungi un **Disk** (es. 1 GB) montato su `/data` e imposta `DATA_DIR=/data`.
4. Environment → `TMDB_API_KEY`.

### Railway
1. New Project → Deploy from GitHub.
2. Aggiungi un **Volume** montato su `/data` e imposta `DATA_DIR=/data`.
3. Variables → `TMDB_API_KEY`. Railway rileva `npm start` da solo (oppure imposta build `npm run build` e start `node server/index.js`).

### Fly.io
```bash
fly launch --no-deploy            # usa il Dockerfile del repo
fly volumes create data --size 1
fly secrets set TMDB_API_KEY=la_tua_key
# in fly.toml: [mounts] source="data" destination="/app/data"
fly deploy
```

### VPS / server proprio (Docker)
```bash
docker build -t tv-streamy .
docker run -d -p 3001:3001 \
  -e TMDB_API_KEY=la_tua_key \
  -v tvstreamy-data:/app/data \
  tv-streamy
```
Metti davanti nginx/Caddy per TLS. Senza Docker: `npm ci && npm run build && TMDB_API_KEY=… node server/index.js` sotto systemd o pm2.

### E il solo frontend statico (GitHub Pages, Netlify, Vercel)?
Possibile ma degradato: `dist/` si deploya ovunque, però senza backend niente commenti reali, niente sync e niente TMDB (il proxy vive sul server). In quel caso deploya il backend altrove (Render/Railway/Fly) e imposta al build `VITE_API_URL=https://il-tuo-backend/api`. Nota per Vercel/Netlify "serverless": SQLite su disco non sopravvive tra le invocazioni — preferisci le piattaforme con disco persistente qui sopra.

## Limiti noti / prossimi passi

- **Autenticazione**: oggi l'identità è un codice dispositivo (`X-User-Id`). Il middleware in `server/index.js` è il punto unico dove innestare il login vero (JWT/OAuth) senza toccare le rotte.
- I conflitti di sync sono risolti "ultimo che scrive vince" (con rilevamento a versione): sufficiente per un utente con più dispositivi, non per la collaborazione.
- Funzioni social (follower, gruppi, attività) ancora simulate lato client.
- SQLite è perfetto per un'istanza singola; per scalare orizzontalmente serve passare a Postgres (le query in `server/` sono SQL standard).

I dati e le immagini dei titoli sono forniti da [TMDB](https://www.themoviedb.org). Questo prodotto usa le API TMDB ma non è approvato o certificato da TMDB.
