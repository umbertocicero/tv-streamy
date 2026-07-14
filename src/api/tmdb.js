import { TMDB_CONFIG } from '../config.js';

// Rate limiter semplice
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async wait() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.wait();
      }
    }

    this.requests.push(now);
  }
}

export class TMDBClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = TMDB_CONFIG.baseUrl;
    this.limiter = new RateLimiter(
      TMDB_CONFIG.rateLimit.maxRequests,
      TMDB_CONFIG.rateLimit.windowMs
    );
  }

  async fetch(endpoint, params = {}) {
    await this.limiter.wait();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', 'it-IT');

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, value);
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TMDB_CONFIG.requestTimeout);

    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  // Endpoint: ricerca titoli (film + serie)
  async search(query, page = 1) {
    const data = await this.fetch('/search/multi', { query, page });
    return data.results || [];
  }

  // Endpoint: titolo specifico (dettagli completi)
  async getTitle(id, type = 'multi') {
    try {
      // Determina se è film o serie
      let titleData;

      if (type === 'multi' || type === 'auto') {
        // Prova entrambi per auto-detect
        try {
          titleData = await this.fetch(`/tv/${id}`, {
            append_to_response: 'credits,videos'
          });
          titleData.media_type = 'tv';
        } catch {
          titleData = await this.fetch(`/movie/${id}`, {
            append_to_response: 'credits,videos'
          });
          titleData.media_type = 'movie';
        }
      } else {
        const endpoint = type === 'tv' ? '/tv' : '/movie';
        titleData = await this.fetch(`${endpoint}/${id}`, {
          append_to_response: 'credits,videos'
        });
        titleData.media_type = type;
      }

      return titleData;
    } catch (error) {
      console.error(`Failed to fetch TMDB title ${id}:`, error);
      throw error;
    }
  }

  // Endpoint: trending titoli
  async getTrending(timeWindow = 'week', type = 'all', page = 1) {
    const data = await this.fetch(`/trending/${type}/${timeWindow}`, { page });
    return data.results || [];
  }

  // Endpoint: generi disponibili
  async getGenres(type = 'movie') {
    const data = await this.fetch(`/genre/${type}/list`);
    return data.genres || [];
  }

  // Endpoint: scopri titoli con filtri
  async discoverTitles(type = 'movie', filters = {}) {
    const params = {
      sort_by: filters.sort || 'popularity.desc',
      with_genres: filters.genres?.join(','),
      year: filters.year,
      page: filters.page || 1,
    };

    const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
    const data = await this.fetch(endpoint, params);
    return data.results || [];
  }

  // Endpoint: stagioni di una serie
  async getSeasons(tvId, seasonNumber) {
    const data = await this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
    return data.episodes || [];
  }

  // Endpoint: cast di un titolo
  async getCredits(id, type = 'movie') {
    const endpoint = type === 'tv' ? `/tv/${id}/credits` : `/movie/${id}/credits`;
    const data = await this.fetch(endpoint);
    return {
      cast: data.cast || [],
      crew: data.crew || [],
    };
  }
}

// Singleton client
export const tmdbClient = new TMDBClient(TMDB_CONFIG.apiKey);
