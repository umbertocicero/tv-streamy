// Configurazione centralizzata dell'app.
// I metadati passano dal proxy del backend (/api/tmdb): la API key TMDB
// vive solo sul server (variabile d'ambiente TMDB_API_KEY).
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const TMDB_CONFIG = {
  baseUrl: `${API_BASE}/tmdb`,
  imageBase: "https://image.tmdb.org/t/p",
  posterSize: "w342",
  backdropSize: "w780",
  cacheExpiryHours: parseInt(import.meta.env.VITE_TMDB_CACHE_EXPIRY_HOURS || 168),
  requestTimeout: 8000, // ms
  rateLimit: {
    maxRequests: 40,
    windowMs: 1000,
  },
};

export const API_CONFIG = { baseUrl: API_BASE };

// URL helpers — le immagini arrivano direttamente dal CDN TMDB (nessuna key richiesta)
export function getTmdbImageUrl(path, size = "w342") {
  if (!path) return null;
  return `${TMDB_CONFIG.imageBase}/${size}${path}`;
}

export function getTmdbPosterUrl(path) {
  return getTmdbImageUrl(path, TMDB_CONFIG.posterSize);
}

export function getTmdbBackdropUrl(path) {
  return getTmdbImageUrl(path, TMDB_CONFIG.backdropSize);
}
