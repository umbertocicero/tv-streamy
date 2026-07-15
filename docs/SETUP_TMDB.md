# Setup TMDB API

TV Streamy usa **The Movie Database (TMDB)** per catalogo, metadati e poster.
La API key vive **solo sul backend** (variabile d'ambiente `TMDB_API_KEY`): il client
chiama il proxy `/api/tmdb/*`, che aggiunge la key, applica una whitelist di path e
cacha le risposte in SQLite (default 24h, configurabile con `TMDB_CACHE_HOURS`).

## Registrazione (gratuita, ~5 minuti)

1. Crea un account su <https://www.themoviedb.org/signup>
2. Vai su <https://www.themoviedb.org/settings/api> e richiedi una key (uso personale/developer)
3. Copia la **API Key (v3 auth)**

## Sviluppo locale

```bash
# terminale 1 — backend
TMDB_API_KEY=la_tua_key npm run dev:server

# terminale 2 — frontend (proxa /api verso :3001)
npm run dev
```

In alternativa metti `TMDB_API_KEY=...` in `.env.local` (non committato) e lancia
`npm run dev:server` con un loader tipo `node --env-file=.env.local server/index.js`.

## Produzione

Imposta `TMDB_API_KEY` come variabile d'ambiente/secret della piattaforma
(Render → Environment, Railway → Variables, Fly → `fly secrets set`, Docker → `-e`).
Mai nel bundle frontend: qualunque variabile `VITE_*` finisce in chiaro nel JS pubblicato.

## Comportamento senza key

Il proxy risponde `503 tmdb_not_configured` e il client degrada automaticamente al
catalogo mock locale: l'app resta utilizzabile per demo e sviluppo offline.

## Fallback e cache

Catena del client per i metadati:

1. indice in memoria (titoli già visti nella sessione)
2. cache IndexedDB/localStorage (TTL 7 giorni)
3. `/api/tmdb/*` → cache SQLite del server (TTL 24h, serve anche risposte scadute se TMDB è giù)
4. TMDB live
5. catalogo mock (`src/data/catalog.js`)

## Endpoint proxati (whitelist in `server/routes/tmdb.js`)

```
/search/multi                 ricerca titoli
/trending/{all|movie|tv}/{day|week}
/discover/{movie|tv}          scoperta con filtri
/{movie|tv}/{id}              dettagli (+credits,videos)
/tv/{id}/season/{n}           episodi
/{movie|tv}/{id}/credits      cast
/genre/{movie|tv}/list        generi
```

I poster arrivano direttamente dal CDN (`https://image.tmdb.org/t/p/w342/...`):
nessuna key richiesta per le immagini.

## Attribuzione

TMDB richiede attribuzione: "Questo prodotto usa le API TMDB ma non è approvato
o certificato da TMDB" (già presente nel README).
