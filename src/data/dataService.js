import { tmdbClient } from '../api/tmdb.js';
import { cache } from './cache.js';
import { CATALOG as FALLBACK_CATALOG } from './catalog.js';
import { TMDB_CONFIG } from '../config.js';

// Normalizza risposte TMDB al formato interno dell'app
function normalizeTmdbTitle(tmdbData) {
  if (!tmdbData) return null;

  const isTV = tmdbData.media_type === 'tv' || tmdbData.episode_run_time;
  const id = String(tmdbData.id);

  return {
    id,
    type: isTV ? 'serie' : 'film',
    title: tmdbData.title || tmdbData.name,
    overview: tmdbData.overview || '',
    genres: (tmdbData.genres || []).map(g => g.name || g),
    year: tmdbData.release_date
      ? parseInt(tmdbData.release_date.slice(0, 4))
      : tmdbData.first_air_date
        ? parseInt(tmdbData.first_air_date.slice(0, 4))
        : 0,
    rating: tmdbData.vote_average ? tmdbData.vote_average / 2 : 0,
    votes: tmdbData.vote_count || 0,
    poster_path: tmdbData.poster_path,
    backdrop_path: tmdbData.backdrop_path,
    runtime: isTV
      ? (tmdbData.episode_run_time?.[0] || 45)
      : (tmdbData.runtime || 120),

    // Cast: limita a 8 persone
    cast: ((tmdbData.credits?.cast || []).slice(0, 8)).map(c => [
      c.name,
      c.character || '',
    ]),

    // Seasons per serie
    seasons: (tmdbData.seasons || [])
      .filter(s => s.season_number !== 0) // Escludi "Specials"
      .map(s => ({
        n: s.season_number,
        episodes: s.episode_count || 0,
        posterPath: s.poster_path,
      })),

    // Trailer
    trailer: tmdbData.videos?.results?.[0]?.key || null,

    // Aggiunte (mock per ora)
    added: Math.floor(Math.random() * 1000000),
    comments: Math.floor(Math.random() * 50000),
  };
}

class DataService {
  constructor() {
    this.tmdb = tmdbClient;
    this.cache = cache;
    this.isCached = false;
    // Indice in memoria dei titoli normalizzati già visti (catalogo, ricerche,
    // dettagli): permette l'accesso sincrono byId() dalle viste.
    // Il seeding dal catalogo mock è lazy per evitare il ciclo di import
    // catalog.js ⇄ dataService.js in fase di valutazione dei moduli.
    this.memory = new Map();
    this.seeded = false;
  }

  seedMemory() {
    if (this.seeded) return;
    this.seeded = true;
    FALLBACK_CATALOG.forEach(t => this.memory.set(String(t.id), t));
  }

  remember(title) {
    if (title?.id != null) this.memory.set(String(title.id), title);
    return title;
  }

  getFromMemory(id) {
    this.seedMemory();
    return this.memory.get(String(id)) || null;
  }

  // Fetch catalogo (trending iniziale)
  async fetchCatalog(force = false) {
    const cacheKey = 'catalog_trending';

    // Prova cache
    if (!force) {
      const cached = await this.cache.get(cacheKey);
      if (cached && cached.length > 0) {
        this.isCached = true;
        cached.forEach(t => this.remember(t));
        return cached;
      }
    }

    try {
      const results = await this.tmdb.getTrending('week', 'all', 1);

      // Normalizza e filtra per tipo
      const normalized = results
        .map(item => {
          try {
            return normalizeTmdbTitle({
              ...item,
              media_type: item.media_type === 'person' ? 'movie' : item.media_type,
            });
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .slice(0, 50); // Limita a 50

      normalized.forEach(t => this.remember(t));

      // Salva in cache (7 giorni)
      await this.cache.set(cacheKey, normalized, TMDB_CONFIG.cacheExpiryHours);

      return normalized;
    } catch (error) {
      console.error('Failed to fetch catalog from TMDB:', error);

      // Fallback a mock
      this.isCached = true;
      return FALLBACK_CATALOG.slice(0, 50);
    }
  }

  // Fetch singolo titolo completo
  async fetchTitle(id, force = false) {
    const cacheKey = `title_${id}`;

    // Prova cache
    if (!force) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.isCached = true;
        return this.remember(cached);
      }
    }

    // I titoli del catalogo mock non esistono su TMDB: risolvi localmente
    const local = FALLBACK_CATALOG.find(t => String(t.id) === String(id));
    if (local) return local;

    try {
      const tmdbTitle = await this.tmdb.getTitle(id, 'auto');
      const normalized = normalizeTmdbTitle(tmdbTitle);
      this.remember(normalized);

      // Salva in cache (7 giorni)
      await this.cache.set(cacheKey, normalized, TMDB_CONFIG.cacheExpiryHours);

      return normalized;
    } catch (error) {
      console.error(`Failed to fetch title ${id}:`, error);

      // Fallback a mock
      const fallback = FALLBACK_CATALOG.find(t => String(t.id) === String(id));
      this.isCached = true;
      return fallback || null;
    }
  }

  // Ricerca titoli
  async searchTitles(query, page = 1) {
    if (!query || query.trim().length < 2) return [];

    try {
      const results = await this.tmdb.search(query, page);

      return results
        .filter(item => item.media_type !== 'person')
        .map(item => {
          try {
            return this.remember(normalizeTmdbTitle(item));
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback: ricerca locale nel catalogo mock
      const ql = query.trim().toLowerCase();
      return FALLBACK_CATALOG.filter(t => t.title.toLowerCase().includes(ql));
    }
  }

  // Discover con filtri
  async discoverTitles(type = 'movie', filters = {}) {
    try {
      const results = await this.tmdb.discoverTitles(type, filters);

      return results
        .map(item => {
          try {
            return this.remember(normalizeTmdbTitle({
              ...item,
              media_type: type === 'tv' ? 'tv' : 'movie',
            }));
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Discover failed:', error);
      return [];
    }
  }

  // Fetch episodi di una stagione
  async fetchSeasonEpisodes(seriesId, seasonNumber) {
    const cacheKey = `episodes_${seriesId}_s${seasonNumber}`;

    // Prova cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const episodes = await this.tmdb.getSeasons(seriesId, seasonNumber);

      const normalized = episodes.map(ep => ({
        n: ep.episode_number,
        title: ep.name,
        overview: ep.overview,
        airDate: ep.air_date,
        still_path: ep.still_path,
      }));

      await this.cache.set(cacheKey, normalized, TMDB_CONFIG.cacheExpiryHours);
      return normalized;
    } catch (error) {
      console.error(`Failed to fetch episodes ${seriesId}:`, error);
      return [];
    }
  }

  // Fetch generi
  async fetchGenres(type = 'movie') {
    const cacheKey = `genres_${type}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const genres = await this.tmdb.getGenres(type);
      await this.cache.set(cacheKey, genres, TMDB_CONFIG.cacheExpiryHours);
      return genres;
    } catch (error) {
      console.error('Failed to fetch genres:', error);
      return [];
    }
  }

  // Utility: pulisci cache
  async clearCache() {
    await this.cache.clear();
  }
}

// Singleton
export const dataService = new DataService();
