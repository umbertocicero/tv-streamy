# Setup TMDB API

## Panoramica

TV Streamy integra **The Movie Database (TMDB)** per fornire catalogo real-time di film e serie TV.

### Caratteristiche

- ✅ **Free tier**: 40 richieste/secondo (illimitato)
- ✅ **Copertune**: CDN veloce con URL diretti (nessun proxy)
- ✅ **Catalogo**: 900k+ titoli con metadati completi
- ✅ **Cache**: IndexedDB + localStorage fallback (7gg TTL)
- ✅ **Offline**: Fallback automatico a mock data se API down

---

## Registrazione

1. Vai su https://www.themoviedb.org/settings/api
2. Crea un account (gratuito)
3. Richiedi una **API Read Access Token** (v4 - Bearer Token)
4. Copia il token (esempio: `eyJhbGciOiJIUzI1NiJ9...`)

---

## Configurazione Locale

### 1. Aggiorna `.env.local`

```bash
# .env.local
VITE_TMDB_API_KEY=YOUR_REAL_API_KEY_HERE
VITE_TMDB_CACHE_EXPIRY_HOURS=168
```

Sostituisci `YOUR_REAL_API_KEY_HERE` con il tuo token TMDB.

### 2. Avvia dev server

```bash
npm run dev
```

Dev server caricherà `.env.local` e userà la vera TMDB API.

### 3. Verifica nei browser devtools

Console → dovresti NON vedere il warning:
```
⚠️ TV Streamy sta usando TMDB test key...
```

Se non c'è l'avviso, l'integrazione è riuscita! ✅

---

## Deploy (Produzione)

### GitHub Pages / Vercel / Netlify

**Non** mettere l'API key in `.env.local` → verrà committato e leakato!

Invece, usa i **secrets** di ciascuna piattaforma:

#### GitHub Pages

1. Vai a **Impostazioni** → **Secrets and variables** → **Actions**
2. Crea nuovo secret: `VITE_TMDB_API_KEY`
3. Aggiorna `.github/workflows/deploy.yml`:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
        env:
          VITE_TMDB_API_KEY: ${{ secrets.VITE_TMDB_API_KEY }}
      - uses: actions/upload-pages-artifact@v2
        with:
          path: dist/
```

#### Vercel

1. Vai a **Settings** → **Environment Variables**
2. Aggiungi:
   - **Name**: `VITE_TMDB_API_KEY`
   - **Value**: il tuo token TMDB
   - **Environments**: Production

Vercel lo userà automaticamente durante il build.

#### Netlify

1. Vai a **Site settings** → **Build & deploy** → **Environment**
2. Aggiungi:
   - **Key**: `VITE_TMDB_API_KEY`
   - **Value**: il tuo token TMDB

---

## Debugging

### Warning: "Using test key"

Significa che `.env.local` non è stato caricato o è vuoto.

**Soluzione**: Riavvia dev server dopo aver modificato `.env.local`:
```bash
# Ctrl+C nel terminal
npm run dev
```

### Errori di API (429, 401)

- **429 (Rate limit)**: Aspetta qualche minuto. TMDB ha 40 req/sec.
- **401 (Invalid API key)**: Verifica che il token sia corretto.
- **Timeout**: TMDB server potrebbe essere lento. L'app fallback ai mock automaticamente.

### Cache non funziona

Cancella IndexedDB:
```javascript
// Chrome DevTools → Application → IndexedDB → tvstreamy_cache → DELETE
```

O cancella localStorage:
```javascript
// Console
Object.keys(localStorage).filter(k => k.startsWith('cache_')).forEach(k => localStorage.removeItem(k))
```

---

## Limitazioni della Test Key

La test key (`test_key_development_only`) **non funziona** con l'API live.

Se tenti di cercare / caricare titoli, fallback automaticamente ai mock data locali. Questo è intenzionale per testing offline.

**Per usare TMDB real, registrati e configura come sopra.**

---

## Performance

### Bundle Size

TMDB client aggiunge **~5KB** al bundle finale (già incluso).

### Rate Limiting

TMDB free tier: **40 req/sec**

TV Streamy usa:
- Batch requests (max 1 ricerca/sec)
- Cache aggressiva (7 giorni TTL)
- IndexedDB + localStorage per fallback

No problemi di rate limit in uso normale.

### Immagini

Poster scaricati da CDN TMDB (nessun proxy):
- **CDN**: https://image.tmdb.org/t/p/
- **Tagli disponibili**: w92, w154, w185, w342, w500, w780

App usa `w342` di default (dimensione ottimale mobile).

---

## API Endpoints Usati

```
/search/multi          - Ricerca titoli
/trending/{type}/week  - Trending
/discover/{type}       - Scopri con filtri
/movie/{id}            - Dettagli film
/tv/{id}               - Dettagli serie
/tv/{id}/season/{n}    - Episodi stagione
/genre/{type}/list     - Lista generi
```

Tutti includono crediti (cast) e video (trailer).

---

## Licenza TMDB

TMDB fornisce i dati sotto licenza Creative Commons 3.0.

Usi consentiti:
- ✅ App private/personali
- ✅ Progetti educativi
- ✅ Demo pubbliche

Non consentiti:
- ❌ Vendere l'accesso ai dati
- ❌ Ripubblicare senza attribuzione

**Aggiungi disclaimer** nel footer dell'app:

```html
<div style="font-size: 10px; color: #999;">
  Powered by <a href="https://www.themoviedb.org/">The Movie Database (TMDB)</a>
</div>
```

---

## Prossimi Passi

1. **Registrati su TMDB** e ottieni una vera API key
2. **Aggiorna `.env.local`** con il token
3. **Riavvia dev server**
4. **Testa**: Cerca un titolo nel tab "Esplora" 🎬

Domande? Vedi [TMDB API Docs](https://developer.themoviedb.org/docs).
