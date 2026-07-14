// Utility pure di formattazione e presentazione: nessuna dipendenza da stato o DOM.

// Gradiente deterministico dal titolo: sostituisce i poster reali senza asset esterni.
export function posterGradient(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  const h1 = h % 360, h2 = (h1 + 40 + (h % 60)) % 360;
  return `linear-gradient(160deg, hsl(${h1},45%,28%), hsl(${h2},55%,16%))`;
}

export const fmtCount = n =>
  n >= 1e6 ? (n / 1e6).toFixed(2).replace(".", ",") + " Mln" : String(n);

export const starsInline = r => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

export function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360},60%,70%)`;
}

export const typeIcon = t => (t === "film" ? "🎬" : "📺");

export const pad2 = n => String(n).padStart(2, "0");

export function runtimeMinutes(item) {
  if (!item.runtime) return 45;
  const m = item.runtime.match(/(?:(\d+)h)?\s*(\d+)?m?/);
  return parseInt(m[1] || 0) * 60 + parseInt(m[2] || 0);
}

export const todayLabel = () =>
  new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
