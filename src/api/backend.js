// Client del backend TV Streamy.
// Identità dispositivo: un ID generato al primo avvio e salvato in localStorage.
// Per collegare un altro dispositivo si inserisce lo stesso codice (Impostazioni →
// Sincronizzazione). L'autenticazione vera sostituirà questo meccanismo.
const BASE = import.meta.env.VITE_API_URL || "/api";
const DEVICE_KEY = "tvstreamy_sync_id";

export function getSyncId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .replace(/[^\w-]/g, "");
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function setSyncId(id) {
  const clean = (id || "").trim();
  if (!/^[\w-]{8,64}$/.test(clean)) throw new Error("Codice non valido (8-64 caratteri alfanumerici)");
  localStorage.setItem(DEVICE_KEY, clean);
  return clean;
}

async function call(method, path, body, { username } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getSyncId(),
      ...(username ? { "X-Username": username } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const err = new Error(payload.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return res.json();
}

export const backend = {
  health: () => call("GET", "/health"),

  // Stato multi-dispositivo
  getState: () => call("GET", "/state"),
  putState: (data, baseVersion, username) => call("PUT", "/state", { data, baseVersion }, { username }),
  deleteAccount: () => call("DELETE", "/state"),

  // Commenti
  getComments: (titleId, langs = []) =>
    call("GET", `/titles/${encodeURIComponent(titleId)}/comments${langs.length ? `?langs=${encodeURIComponent(langs.join(","))}` : ""}`),
  getReplies: commentId => call("GET", `/comments/${commentId}/replies`),
  postComment: (titleId, text, { lang, parentId, username } = {}) =>
    call("POST", `/titles/${encodeURIComponent(titleId)}/comments`, { text, lang, parentId }, { username }),
  likeComment: commentId => call("POST", `/comments/${commentId}/like`),
  reportComment: (commentId, reason) => call("POST", `/comments/${commentId}/report`, { reason }),
  deleteComment: commentId => call("DELETE", `/comments/${commentId}`),
};
