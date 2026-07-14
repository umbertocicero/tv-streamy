// Configurazione centralizzata dell'app
const apiKey = import.meta.env.VITE_TMDB_API_KEY || 'test_key_development_only';
const isTestKey = apiKey === 'test_key_development_only';

if (isTestKey) {
  console.warn(
    '⚠️ TV Streamy sta usando TMDB test key. Registrati gratis per ottenere una vera key:',
    'https://www.themoviedb.org/settings/api'
  );
}

export const TMDB_CONFIG = {
  apiKey,
  isTestKey,
  baseUrl: 'https://api.themoviedb.org/3',
  imageBase: 'https://image.tmdb.org/t/p',
  posterSize: 'w342',
  backdropSize: 'w780',
  cacheExpiryHours: parseInt(import.meta.env.VITE_TMDB_CACHE_EXPIRY_HOURS || 168),
  requestTimeout: 8000, // ms
  rateLimit: {
    maxRequests: 40,
    windowMs: 1000,
  },
};

// URL helpers
export function getTmdbImageUrl(path, size = 'w342') {
  if (!path) return null;
  return `${TMDB_CONFIG.imageBase}/${size}${path}`;
}

export function getTmdbPosterUrl(path) {
  return getTmdbImageUrl(path, TMDB_CONFIG.posterSize);
}

export function getTmdbBackdropUrl(path) {
  return getTmdbImageUrl(path, TMDB_CONFIG.backdropSize);
}
