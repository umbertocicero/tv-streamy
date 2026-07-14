// Selettori di dominio: funzioni pure che derivano informazioni dallo stato utente.
// Tenerle fuori dai componenti le rende testabili e riusabili tra le viste.
import { byId } from "../data/catalog.js";
import { runtimeMinutes } from "./format.js";

export const epKey = (id, s, e) => `${id}|${s}|${e}`;

export const isWatched = (S, id) => !!S.watched[id];

export function totalEpisodes(serie) {
  return (serie.seasons || []).reduce((a, s) => a + s.eps.length, 0);
}

export function watchedEpisodes(S, serie) {
  let n = 0;
  for (const season of serie.seasons || [])
    for (let e = 1; e <= season.eps.length; e++)
      if (S.watched[epKey(serie.id, season.n, e)]) n++;
  return n;
}

export const remainingEpisodes = (S, serie) => totalEpisodes(serie) - watchedEpisodes(S, serie);

// Primo episodio non visto, in ordine di stagione/episodio.
export function nextEpisode(S, serie) {
  for (const season of serie.seasons || [])
    for (let e = 0; e < season.eps.length; e++)
      if (!S.watched[epKey(serie.id, season.n, e + 1)])
        return { s: season.n, e: e + 1, title: season.eps[e], remaining: remainingEpisodes(S, serie) };
  return null;
}

// Un titolo è "visto" se film spuntato o serie con almeno un episodio guardato.
export function titleSeen(S, item) {
  return isWatched(S, item.id) || (item.type === "serie" && watchedEpisodes(S, item) > 0);
}

export function watchMinutes(item) {
  return item.type === "film" ? runtimeMinutes(item) : 45;
}

// ---- statistiche ----
export function statTotals(S) {
  let serieMin = 0, filmMin = 0, eps = 0, films = 0;
  for (const log of S.watchLog)
    log.type === "serie" ? ((serieMin += log.minutes), eps++) : ((filmMin += log.minutes), films++);
  const split = min => ({
    mesi: Math.floor(min / 43200),
    giorni: Math.floor((min % 43200) / 1440),
    ore: Math.floor((min % 1440) / 60),
  });
  return { serie: split(serieMin), film: split(filmMin), eps, films };
}

export function last7(S, kind, field) {
  const now = Date.now(), day = 86400000;
  return S.watchLog
    .filter(l => l.type === kind && now - l.ts < 7 * day)
    .reduce((a, l) => a + (field === "count" ? 1 : l.minutes), 0);
}

export function dailySeries(S, kind, days, field) {
  const out = [], labels = [], now = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - d);
    const end = start.getTime() + 86400000;
    const v = S.watchLog
      .filter(l => l.type === kind && l.ts >= start.getTime() && l.ts < end)
      .reduce((a, l) => a + (field === "count" ? 1 : Math.round(l.minutes / 60)), 0);
    out.push(v);
    labels.push(start.getDate());
  }
  return [out, labels];
}

export function backlogEpisodes(S) {
  return S.added
    .map(byId)
    .filter(x => x && x.type === "serie")
    .reduce((a, s) => a + remainingEpisodes(S, s), 0);
}
