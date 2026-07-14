/* TV Streamy — SPA vanilla JS. Stato utente in localStorage, catalogo mock in data.js */

// ---------------------------------------------------------------- stato
const DEFAULT_STATE = {
  loggedIn: false,
  username: "110411111",
  email: "umbertocicero@gmail.com",
  userId: "110411111",
  privateProfile: false,
  emailOptIn: false,
  added: [],                 // id titoli in libreria
  watched: {},               // filmId -> true, oppure "serieId|s|e" -> true
  favorites: [],             // id preferiti
  ratings: {},               // id -> 1..5
  reactions: {},             // id -> indice emoji
  wheres: {},                // id -> theater|altro|non-ufficiale
  polls: {},                 // id -> opzione sondaggio
  lists: [{ name: "lista mia", items: ["endgame"], private: true }],
  myComments: {},            // id -> [{user,date,text,likes,replies}]
  likedComments: {},         // "titleId:idx" -> true
  langs: ["Italiano", "Inglese"],
  watchLog: [],              // {id, minutes, ts} per statistiche
};
let S = loadState();
function loadState() {
  try { return Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem("tvstreamy") || "{}")); }
  catch { return { ...DEFAULT_STATE }; }
}
function save() { localStorage.setItem("tvstreamy", JSON.stringify(S)); }

// ---------------------------------------------------------------- helpers
const $app = document.getElementById("app");
const $modal = document.getElementById("modal-root");
const byId = id => CATALOG.find(x => x.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmtCount = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace(".", ",") + " Mln" : String(n);
const isAdded = id => S.added.includes(id);
const isFav = id => S.favorites.includes(id);
const isWatched = id => !!S.watched[id];

function runtimeMinutes(item) {
  if (!item.runtime) return 45;
  const m = item.runtime.match(/(?:(\d+)h)?\s*(\d+)?m?/);
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0);
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function poster(item, size, withAdd) {
  const addBtn = withAdd ? `<button class="qadd ${isAdded(item.id) ? "added" : ""}" onclick="event.stopPropagation();toggleAdd('${item.id}')">${isAdded(item.id) ? "✓" : "+"}</button>` : "";
  return `<div class="poster ${size}" style="background:${posterGradient(item.title)}" onclick="openDetail('${item.id}')">${addBtn}<span>${esc(item.title)}</span></div>`;
}
function typeIcon(t) { return t === "film" ? "🎬" : "📺"; }
function starsInline(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function avatarColor(name) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360},60%,70%)`;
}

// ---------------------------------------------------------------- router
let route = { view: S.loggedIn ? "serie" : "login" };
const routeStack = [];
function go(view, params = {}, push = true) {
  if (push) routeStack.push(route);
  route = { view, ...params };
  render();
  window.scrollTo(0, 0);
}
function back() {
  route = routeStack.pop() || { view: "serie" };
  render();
}
function render() {
  const views = {
    login: viewLogin, serie: viewSerie, film: viewFilm, esplora: viewEsplora, profilo: viewProfilo,
    detail: viewDetail, comments: viewComments, browse: viewBrowse, search: viewSearch,
    liste: viewListe, statistiche: viewStatistiche, impostazioni: viewImpostazioni, lingua: viewLingua,
  };
  $app.innerHTML = (views[route.view] || viewSerie)();
}
function bottomNav(active) {
  const items = [["serie", "📺", "Serie"], ["film", "🎬", "Film"], ["esplora", "🔍", "Esplora"], ["profilo", "👤", "Profilo"]];
  return `<nav class="bottomnav">${items.map(([v, ic, l]) =>
    `<button class="${active === v ? "active" : ""}" onclick="routeStack.length=0;go('${v}',{},false)"><span class="ico">${ic}</span>${l}</button>`).join("")}</nav>`;
}
function topbar(title, opts = {}) {
  return `<header class="topbar">
    ${opts.back ? `<button class="back" onclick="back()">‹</button>` : ""}
    <div class="title-wrap">${esc(title)}${opts.sub ? `<div class="sub">${esc(opts.sub)}</div>` : ""}</div>
    ${opts.right || ""}
  </header>`;
}

// ---------------------------------------------------------------- login
function viewLogin() {
  const mosaic = CATALOG.map(i => `<div class="poster" style="background:${posterGradient(i.title)}"><span>${esc(i.title)}</span></div>`).join("");
  return `<div class="login">
    <div class="mosaic">${mosaic}${mosaic}</div>
    <div class="overlay">
      <div class="logo"><span class="t">T</span> TV STREAMY</div>
      <div class="tagline">📅 Ricorda il punto in cui avevi interrotto la visione</div>
      <div class="panel">
        <h2>Continua con</h2>
        <div class="socials">
          <button class="s-apple" onclick="doLogin('Apple')"></button>
          <button class="s-fb" onclick="doLogin('Facebook')">f</button>
          <button class="s-google" onclick="doLogin('Google')">G</button>
          <button class="s-x" onclick="doLogin('X')">𝕏</button>
          <button class="s-mail" onclick="doLogin('Email')">✉️</button>
        </div>
        <label class="optin">
          <span class="cbx ${S.emailOptIn ? "on" : ""}" onclick="S.emailOptIn=!S.emailOptIn;save();render()">${S.emailOptIn ? "✓" : ""}</span>
          Voglio ricevere aggiornamenti via email sulle mie serie e sui miei film
        </label>
        <div class="terms">Continuando accetti le <a href="#" onclick="return false">condizioni d'uso</a> e le <a href="#" onclick="return false">norme sulla privacy</a> di TV Streamy</div>
      </div>
    </div>
  </div>`;
}
function doLogin(provider) {
  S.loggedIn = true;
  if (!S.added.length) S.added = ["hotd"];
  save();
  toast(`Accesso con ${provider} effettuato`);
  go("serie", {}, false);
}

// ---------------------------------------------------------------- serie (watchlist / in arrivo)
function nextEpisode(serie) {
  for (const season of serie.seasons || []) {
    for (let e = 0; e < season.eps.length; e++) {
      if (!S.watched[`${serie.id}|${season.n}|${e + 1}`]) {
        return { s: season.n, e: e + 1, title: season.eps[e], remaining: remainingEpisodes(serie) };
      }
    }
  }
  return null;
}
function totalEpisodes(serie) { return (serie.seasons || []).reduce((a, s) => a + s.eps.length, 0); }
function watchedEpisodes(serie) {
  let n = 0;
  for (const season of serie.seasons || [])
    for (let e = 1; e <= season.eps.length; e++)
      if (S.watched[`${serie.id}|${season.n}|${e}`]) n++;
  return n;
}
function remainingEpisodes(serie) { return totalEpisodes(serie) - watchedEpisodes(serie); }

function viewSerie() {
  const tab = route.tab || "watchlist";
  const mySeries = S.added.map(byId).filter(x => x && x.type === "serie");
  let body = "";
  if (tab === "watchlist") {
    const rows = mySeries.map(serie => {
      const next = nextEpisode(serie);
      if (!next) return "";
      const started = watchedEpisodes(serie) > 0;
      return `<div class="state-badge">${started ? "In corso" : "Non iniziato"}</div>
      <div class="ep-row">
        <div class="thumb" style="background:${posterGradient(serie.title)}">${esc(serie.title)}</div>
        <div class="meta">
          <button class="show-badge" onclick="openDetail('${serie.id}')">${esc(serie.title)} ›</button>
          <div class="epnum">S${String(next.s).padStart(2, "0")} | E${String(next.e).padStart(2, "0")} <span class="more">+${next.remaining - 1}</span></div>
          <div class="eptitle">${esc(next.title)}</div>
        </div>
        <button class="checkbtn" onclick="markEpisode('${serie.id}',${next.s},${next.e})">✓</button>
      </div>`;
    }).filter(Boolean).join("");
    body = rows || `<div class="empty-note">Nessuna serie da vedere.<br>Aggiungi serie dal catalogo per iniziare a tracciarle.</div>`;
    body += `<button class="browse-btn" onclick="go('browse',{kind:'serie'})">SFOGLIA TUTTE LE SERIE</button>`;
  } else {
    const upcoming = CATALOG.filter(x => x.type === "serie" && !isAdded(x.id));
    body = `<div class="section"><div class="hscroll">${upcoming.map(i => poster(i, "md", true)).join("")}</div></div>
      <div class="empty-note">Le nuove uscite delle tue serie appariranno qui.</div>`;
  }
  return `
    <div class="tabs no-top">
      <button class="${tab === "watchlist" ? "active" : ""}" onclick="go('serie',{tab:'watchlist'},false)">Lista di cose da vedere</button>
      <button class="${tab === "inarrivo" ? "active" : ""}" onclick="go('serie',{tab:'inarrivo'},false)">In arrivo</button>
    </div>
    ${body}
    ${bottomNav("serie")}`;
}
function markEpisode(id, s, e) {
  S.watched[`${id}|${s}|${e}`] = true;
  S.watchLog.push({ id, minutes: 45, ts: Date.now(), type: "serie" });
  save(); render();
  toast(`S${String(s).padStart(2, "0")} E${String(e).padStart(2, "0")} segnato come visto`);
}

// ---------------------------------------------------------------- film
function viewFilm() {
  const myFilms = S.added.map(byId).filter(x => x && x.type === "film");
  const toWatch = myFilms.filter(f => !isWatched(f.id));
  const seen = myFilms.filter(f => isWatched(f.id));
  return `
    ${topbar("Film")}
    ${toWatch.length ? `<div class="section"><h3>Da vedere</h3></div><div class="grid">${toWatch.map(i => poster(i, "", true)).join("")}</div>` : ""}
    ${seen.length ? `<div class="section"><h3>Visti</h3></div><div class="grid">${seen.map(i => poster(i, "", true)).join("")}</div>` : ""}
    ${!myFilms.length ? `<div class="empty-note">Nessun film in libreria.<br>Cerca un film e aggiungilo con +.</div>` : ""}
    <button class="browse-btn" onclick="go('browse',{kind:'film'})">SFOGLIA TUTTI I FILM</button>
    ${bottomNav("film")}`;
}

// ---------------------------------------------------------------- esplora (feed / scopri / gruppi / attività)
function viewEsplora() {
  const tab = route.tab || "feed";
  let body = "";
  if (tab === "feed") {
    const feed = [...CATALOG].sort((a, b) => b.added - a.added).slice(0, 10);
    body = feed.map(i => `
      <div class="feed-card">
        <div class="hero" style="background:${posterGradient(i.title)}" onclick="openDetail('${i.id}')">
          <button class="qadd ${isAdded(i.id) ? "added" : ""}" onclick="event.stopPropagation();toggleAdd('${i.id}')">${isAdded(i.id) ? "✓" : "+"}</button>
          <div class="label"><h4>${typeIcon(i.type)} ${esc(i.title)}</h4>
          <div class="sub">${i.runtime ? i.runtime + " • " : ""}${i.genres.join(", ")}</div></div>
        </div>
        <div class="desc">${esc(i.overview)}</div>
      </div>`).join("");
  } else if (tab === "scopri") {
    body = discoverBody();
  } else if (tab === "gruppi") {
    body = `<div class="empty-note">💬<br><br>I gruppi ti permettono di commentare le serie con altri fan.<br>Nessun gruppo seguito per ora.</div>`;
  } else {
    body = `<div class="empty-note">🔔<br><br>Qui vedrai l'attività delle persone che segui:<br>episodi visti, valutazioni e commenti.</div>`;
  }
  return `
    <div class="searchbar">
      <div class="field">🔍 <input placeholder="Cerca" onfocus="go('search')"></div>
    </div>
    <div class="chips">
      ${["feed", "scopri", "gruppi", "attività"].map(t =>
        `<button class="${tab === t ? "active" : ""}" onclick="go('esplora',{tab:'${t}'},false)">${t}</button>`).join("")}
    </div>
    ${body}
    ${bottomNav("esplora")}`;
}

// scopri con filtri
let disc = { kind: "film", sort: "trending", genres: [], includeAdded: false };
function discoverBody() {
  let items = CATALOG.filter(x => x.type === (disc.kind === "film" ? "film" : "serie"));
  if (!disc.includeAdded) items = items.filter(x => !isAdded(x.id));
  if (disc.genres.length) items = items.filter(x => x.genres.some(g => disc.genres.includes(g)));
  items.sort((a, b) => disc.sort === "trending" ? b.votes - a.votes : b.added - a.added);
  return `
    <div class="tabs no-top" style="position:static">
      <button class="${disc.kind === "serie" ? "active" : ""}" onclick="disc.kind='serie';render()">Serie</button>
      <button class="${disc.kind === "film" ? "active" : ""}" onclick="disc.kind='film';render()">Film</button>
    </div>
    ${items.map(i => `
      <div class="disc-card" style="background:${posterGradient(i.title)}" onclick="openDetail('${i.id}')">
        <button class="qadd ${isAdded(i.id) ? "added" : ""}" onclick="event.stopPropagation();toggleAdd('${i.id}')">${isAdded(i.id) ? "✓" : "+"}</button>
        <div class="label"><h4>${esc(i.title)}</h4><div class="sub">${i.genres.join(", ")}</div></div>
      </div>`).join("") || `<div class="empty-note">Nessun risultato con i filtri attivi.</div>`}
    <button class="filter-fab" onclick="openFilterSheet()">⚙</button>`;
}
function openFilterSheet() {
  const draft = { ...disc, genres: [...disc.genres] };
  const paint = () => {
    $modal.innerHTML = `<div class="sheet-backdrop" onclick="if(event.target===this)closeModal()">
      <div class="sheet">
        <h3>Sort by</h3>
        <div class="sortrow">
          <button id="f-trending" class="${draft.sort === "trending" ? "active" : ""}">Trending</button>
          <button id="f-added" class="${draft.sort === "added" ? "active" : ""}">Most added</button>
        </div>
        <h3>Genres</h3>
        <div class="genre-grid">
          ${GENRES.map(g => `<button class="genre-tile ${draft.genres.includes(g) ? "sel" : ""}" data-g="${g}" style="background:${posterGradient(g)}">${g}</button>`).join("")}
        </div>
        <h3>Avanzati</h3>
        <div class="advrow">
          <span>Include added movies</span>
          <button class="toggle ${draft.includeAdded ? "on" : ""}" id="f-toggle"><span class="knob"></span></button>
        </div>
        <div class="actions">
          <button class="reset" id="f-reset">REIMPOSTA</button>
          <button class="apply" id="f-apply">APPLICA</button>
        </div>
      </div></div>`;
    document.getElementById("f-trending").onclick = () => { draft.sort = "trending"; paint(); };
    document.getElementById("f-added").onclick = () => { draft.sort = "added"; paint(); };
    document.getElementById("f-toggle").onclick = () => { draft.includeAdded = !draft.includeAdded; paint(); };
    document.getElementById("f-reset").onclick = () => { draft.sort = "trending"; draft.genres = []; draft.includeAdded = false; paint(); };
    document.getElementById("f-apply").onclick = () => { disc = draft; closeModal(); render(); };
    $modal.querySelectorAll(".genre-tile").forEach(b => b.onclick = () => {
      const g = b.dataset.g;
      draft.genres.includes(g) ? draft.genres.splice(draft.genres.indexOf(g), 1) : draft.genres.push(g);
      paint();
    });
  };
  paint();
}
function closeModal() { $modal.innerHTML = ""; }

// sfoglia catalogo (da pulsanti "Sfoglia tutte le serie / i film")
function viewBrowse() {
  const kind = route.kind || "serie";
  const items = CATALOG.filter(x => x.type === kind);
  return `
    ${topbar(kind === "serie" ? "Tutte le serie" : "Tutti i film", { back: true })}
    <div class="grid" style="margin-top:12px">${items.map(i => poster(i, "", true)).join("")}</div>
    ${bottomNav(kind)}`;
}

// ---------------------------------------------------------------- ricerca
function viewSearch() {
  const q = route.q || "";
  const tab = route.stab || "titoli";
  const ql = q.trim().toLowerCase();
  let results = "";
  if (tab === "titoli") {
    const items = ql ? CATALOG.filter(x => x.title.toLowerCase().includes(ql)) : [...CATALOG].sort((a, b) => b.votes - a.votes);
    results = items.map(i => `
      <div class="result-row" onclick="openDetail('${i.id}')">
        <div class="poster sm" style="background:${posterGradient(i.title)}"><span>${esc(i.title)}</span></div>
        <div class="meta">
          <div class="rtitle">${esc(i.title)}</div>
          <div class="rsub">${typeIcon(i.type)} ${fmtCount(i.added)} hanno aggiunto ${i.type === "film" ? "questo film" : "questa serie"}</div>
        </div>
        <button class="qadd ${isAdded(i.id) ? "added" : ""}" style="position:static" onclick="event.stopPropagation();toggleAdd('${i.id}')">${isAdded(i.id) ? "✓" : "+"}</button>
      </div>`).join("") || `<div class="empty-note">Nessun titolo trovato per “${esc(q)}”.</div>`;
  } else if (tab === "utenti") {
    results = `<div class="empty-note">Cerca altri utenti per nome per seguirli.</div>`;
  } else {
    results = `<div class="empty-note">Cerca gruppi di discussione sulle tue serie.</div>`;
  }
  return `
    <div class="searchbar">
      <div class="field">🔍 <input id="search-input" placeholder="Cerca serie e film" value="${esc(q)}"
        oninput="route.q=this.value;renderSearchKeepFocus()"></div>
      <button class="cancel" onclick="back()">Annulla</button>
    </div>
    <div class="tabs no-top" style="position:static">
      <button class="${tab === "titoli" ? "active" : ""}" onclick="route.stab='titoli';render()">Serie e film</button>
      <button class="${tab === "utenti" ? "active" : ""}" onclick="route.stab='utenti';render()">Utenti</button>
      <button class="${tab === "gruppi" ? "active" : ""}" onclick="route.stab='gruppi';render()">Gruppi</button>
    </div>
    ${results}`;
}
function renderSearchKeepFocus() {
  render();
  const inp = document.getElementById("search-input");
  if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

// ---------------------------------------------------------------- dettaglio
function openDetail(id) { go("detail", { id }); }
function viewDetail() {
  const item = byId(route.id);
  if (!item) return viewSerie();
  const tab = route.dtab || "info";
  const watched = isWatched(item.id) || (item.type === "serie" && watchedEpisodes(item) > 0);
  const related = CATALOG.filter(x => x.id !== item.id && x.type === item.type && x.genres.some(g => item.genres.includes(g))).slice(0, 10);
  const commentCount = item.comments + (S.myComments[item.id] || []).length;

  const infoTab = `
    <div class="card">
      <div class="row-between"><h3>Dove guardare</h3><button onclick="toast('Configura i tuoi servizi di streaming in Impostazioni')">⚙️</button></div>
      <div style="color:var(--fg-dim);font-size:14px">Non disponibile</div>
    </div>
    <div class="card">
      <h3>Informazioni ${item.type}</h3>
      <div class="rating-line"><span class="tlogo">T</span><span class="stars-inline">${starsInline(item.rating)}</span><b>${item.rating}/5</b><span style="color:var(--fg-dim)">${item.votes.toLocaleString("it-IT")} voti</span></div>
      <div class="overview">${esc(item.overview)}</div>
      <div class="trailer" onclick="toast('Riproduzione trailer (mock)')">
        <div class="thumb">▶️</div>
        <div><b>Guarda il trailer</b><div style="color:var(--fg-dim);font-size:13px;margin-top:3px">${item.trailer}</div></div>
      </div>
    </div>
    <div class="social-count">👥 ${fmtCount(item.added + (isAdded(item.id) ? 1 : 0))} hanno aggiunto ${item.type === "film" ? "questo film" : "questa serie"}</div>
    <div class="section cast-scroll">
      <h3>Cast</h3>
      <div class="hscroll" style="margin-top:10px">
        ${item.cast.map(([a, c]) => `<div class="castcard"><div class="face" style="background:${posterGradient(a)}">👤</div><div class="aname">${esc(a)}</div><div class="cname">${esc(c)}</div></div>`).join("")}
      </div>
    </div>
    ${item.type === "serie" ? seasonsBlock(item) : ""}
    <div class="section">
      <h3>Gli altri hanno visto anche</h3>
      <div class="hscroll" style="margin-top:10px">${related.map(r => poster(r, "md", true)).join("")}</div>
    </div>
    <div class="poll">
      <div class="q">Cosa ti interessa di più di questo ${item.type}?</div>
      ${POLL_OPTIONS.map(o => `<button class="${S.polls[item.id] === o ? "sel" : ""}" onclick="S.polls['${item.id}']='${o}';save();render()">${o}</button>`).join("")}
    </div>
    <button class="comments-link" style="width:100%" onclick="openComments('${item.id}')"><span>Commenti</span><span>${commentCount} ›</span></button>`;

  const altroTab = `
    <div class="altro-box">
      <div class="q">Dove l'hai visto?</div>
      <div class="wherewatched">
        ${[["theater", "🎦", "Theater"], ["altro", "⭕", "Altro"], ["non-ufficiale", "🏴‍☠️", "Servizio non uffic…"]].map(([k, ic, l]) =>
          `<button class="${S.wheres[item.id] === k ? "sel" : ""}" onclick="S.wheres['${item.id}']='${k}';save();render()"><span class="icobox">${ic}</span>${l}</button>`).join("")}
      </div>
    </div>
    <div class="altro-box">
      <div class="q">Valuta questo ${item.type}</div>
      <div class="starrate">
        ${STAR_LABELS.map((l, i) => `<button class="s ${(S.ratings[item.id] || 0) > i ? "on" : ""}" onclick="rateTitle('${item.id}',${i + 1})"><span class="glyph">★</span>${l}</button>`).join("")}
      </div>
    </div>
    <div class="altro-box">
      <div class="q">Che impressione hai avuto?</div>
      <div class="emoji-grid">
        ${EMOJI_REACTIONS.map(([e, l], i) => `<button class="${S.reactions[item.id] === i ? "sel" : ""}" onclick="S.reactions['${item.id}']=${i};save();render()"><span class="e">${e}</span>${l}</button>`).join("")}
      </div>
      <button class="comments-pill" onclick="openComments('${item.id}')">${commentCount} COMMENTI →</button>
    </div>`;

  return `
    <div class="detail-hero" style="background:${posterGradient(item.title)}">
      <button class="close" onclick="back()">⌄</button>
      <button class="menu" onclick="openActions('${item.id}')">•••</button>
      <div class="grad"></div>
      <div class="label"><h1>${esc(item.title)}</h1><div class="genres">${item.genres.join(", ")}</div></div>
    </div>
    <div class="detail-meta">
      <span>📅 ${item.releaseDate || item.year}</span>
      <span>👁 ${watched ? "Visto" : "Non visto"}</span>
      <span class="spacer"></span>
      <button class="checkbtn ${watched ? "done" : ""}" onclick="toggleWatched('${item.id}')">✓</button>
    </div>
    <div class="tabs no-top" style="position:static">
      <button class="${tab === "info" ? "active" : ""}" onclick="route.dtab='info';render()">Info</button>
      <button class="${tab === "altro" ? "active" : ""}" onclick="route.dtab='altro';render()">Altro</button>
    </div>
    ${tab === "info" ? infoTab : altroTab}
    <div style="height:80px"></div>
    <button class="addfilm ${isAdded(item.id) ? "remove" : ""}" onclick="toggleAdd('${item.id}')">
      ${isAdded(item.id) ? "✓ NELLA TUA LIBRERIA — TOCCA PER RIMUOVERE" : `+ AGGIUNGI ${item.type.toUpperCase()}`}
    </button>`;
}
function seasonsBlock(serie) {
  return `<div class="section"><h3>Episodi</h3></div>` + serie.seasons.map(season => season.eps.map((title, i) => {
    const done = !!S.watched[`${serie.id}|${season.n}|${i + 1}`];
    return `<div class="ep-row">
      <div class="thumb" style="background:${posterGradient(serie.title + season.n + i)}">S${season.n}E${i + 1}</div>
      <div class="meta"><div class="epnum">S${String(season.n).padStart(2, "0")} | E${String(i + 1).padStart(2, "0")}</div><div class="eptitle">${esc(title)}</div></div>
      <button class="checkbtn ${done ? "done" : ""}" onclick="toggleEpisode('${serie.id}',${season.n},${i + 1})">✓</button>
    </div>`;
  }).join("")).join("");
}
function toggleEpisode(id, s, e) {
  const k = `${id}|${s}|${e}`;
  if (S.watched[k]) delete S.watched[k];
  else { S.watched[k] = true; S.watchLog.push({ id, minutes: 45, ts: Date.now(), type: "serie" }); }
  save(); render();
}
function toggleWatched(id) {
  const item = byId(id);
  if (S.watched[id]) delete S.watched[id];
  else {
    S.watched[id] = true;
    if (item.type === "film") S.watchLog.push({ id, minutes: runtimeMinutes(item), ts: Date.now(), type: "film" });
    if (!isAdded(id)) S.added.push(id);
  }
  save(); render();
}
function toggleAdd(id) {
  if (isAdded(id)) { S.added = S.added.filter(x => x !== id); toast("Rimosso dalla libreria"); }
  else { S.added.push(id); toast("Aggiunto alla libreria"); }
  save(); render();
}
function rateTitle(id, n) {
  S.ratings[id] = n; save(); render();
  toast(`Valutato: ${STAR_LABELS[n - 1]}`);
}

// ---------------------------------------------------------------- menu azioni
function openActions(id) {
  const item = byId(id);
  const watched = isWatched(id) || (item.type === "serie" && watchedEpisodes(item) > 0);
  $modal.innerHTML = `<div class="sheet-backdrop" onclick="if(event.target===this)closeModal()">
    <div class="action-sheet">
      <div class="state">${watched ? "Visto" : "Non visto"}</div>
      <button onclick="closeModal();toast('Personalizzazione poster e traccia (mock)')"><span class="ico">✏️</span> Personalizza</button>
      <button onclick="toggleFav('${id}')"><span class="ico">${isFav(id) ? "❤️" : "🤍"}</span> Preferito</button>
      <button onclick="closeModal();addToList('${id}')"><span class="ico">➕</span> Aggiungi alla lista</button>
      <button onclick="closeModal();removeTitle('${id}')"><span class="ico">➖</span> Rimuovi ${item.type === "film" ? "il film" : "la serie"}</button>
      <button onclick="closeModal();shareTitle('${id}')"><span class="ico">↑</span> Condividi</button>
    </div></div>`;
}
function toggleFav(id) {
  isFav(id) ? S.favorites = S.favorites.filter(x => x !== id) : S.favorites.push(id);
  save(); closeModal(); render();
  toast(isFav(id) ? "Aggiunto ai preferiti ❤️" : "Rimosso dai preferiti");
}
function addToList(id) {
  if (!S.lists.length) { toast("Crea prima una lista dal profilo"); return; }
  const list = S.lists[0];
  if (!list.items.includes(id)) { list.items.push(id); save(); toast(`Aggiunto a “${list.name}”`); }
  else toast(`Già presente in “${list.name}”`);
}
function removeTitle(id) {
  S.added = S.added.filter(x => x !== id);
  save(); render(); toast("Rimosso dalla libreria");
}
function shareTitle(id) {
  const item = byId(id);
  if (navigator.share) navigator.share({ title: item.title, text: `Guarda “${item.title}” su TV Streamy!` }).catch(() => {});
  else toast("Link copiato (mock)");
}

// ---------------------------------------------------------------- commenti
function openComments(id) {
  const item = byId(id);
  const watched = isWatched(id) || (item.type === "serie" && watchedEpisodes(item) > 0);
  if (!watched) {
    $modal.innerHTML = `<div class="sheet-backdrop center" onclick="if(event.target===this)closeModal()">
      <div class="spoiler-box">
        <h3>Spoiler a seguire!</h3>
        <p>Non hai ancora visto questo ${item.type}. Vuoi davvero leggere i commenti?</p>
        <div class="btns">
          <button onclick="closeModal();go('comments',{id:'${id}'})">MOSTRA COMUNQUE</button>
          <button onclick="closeModal();toggleWatched('${id}');go('comments',{id:'${id}'})">HO VISTO QUESTO ${item.type === "film" ? "FILM" : "SHOW"}</button>
          <button onclick="closeModal()">ANNULLA</button>
        </div>
      </div></div>`;
  } else go("comments", { id });
}
function commentsFor(id) {
  return [...(SEED_COMMENTS[id] || SEED_COMMENTS.default), ...(S.myComments[id] || [])];
}
function viewComments() {
  const item = byId(route.id);
  const all = commentsFor(item.id);
  const total = item.comments + (S.myComments[item.id] || []).length;
  return `
    ${topbar(item.title, { back: true, sub: `${total} commenti` })}
    <div class="sortline">
      <span class="lab">ORDINA PER</span><span class="val">I più rilevanti</span>
      <button class="gear" onclick="go('lingua')">⚙</button>
    </div>
    ${all.map((c, i) => {
      const lk = `${item.id}:${i}`;
      const liked = S.likedComments[lk];
      return `<div class="comment">
        <div class="chead">
          <div class="avatar" style="background:${avatarColor(c.user)}">${esc(c.user[0].toUpperCase())}</div>
          <div><div class="cuser">${esc(c.user)}</div><div class="cdate">${esc(c.date)}</div></div>
          <button class="flag" onclick="toast('Commento segnalato')">⚑</button>
        </div>
        <div class="ctext">${esc(c.text)}</div>
        ${c.img ? `<div class="cimg" style="background:${posterGradient(c.text)}">${c.img}</div>` : ""}
        <div class="cactions">
          <button class="${liked ? "liked" : ""}" onclick="likeComment('${item.id}',${i})">${liked ? "❤️" : "🤍"} ${(c.likes + (liked ? 1 : 0)).toLocaleString("it-IT")}</button>
          <button onclick="toast('Risposte (mock)')">💬 ${c.replies || 0}</button>
          <button class="share" onclick="toast('Commento condiviso (mock)')">↑</button>
        </div>
      </div>`;
    }).join("")}
    <div style="height:90px"></div>
    <button class="fab-compose" onclick="composeComment('${item.id}')">✏️</button>`;
}
function likeComment(id, i) {
  const k = `${id}:${i}`;
  S.likedComments[k] ? delete S.likedComments[k] : S.likedComments[k] = true;
  save(); render();
}
function composeComment(id) {
  $modal.innerHTML = `<div class="sheet-backdrop" onclick="if(event.target===this)closeModal()">
    <div class="sheet compose-box">
      <h3 style="padding:0 0 12px">Scrivi un commento</h3>
      <textarea id="c-text" placeholder="Cosa ne pensi? (occhio agli spoiler…)"></textarea>
      <button class="send" onclick="sendComment('${id}')">PUBBLICA</button>
    </div></div>`;
  document.getElementById("c-text").focus();
}
function sendComment(id) {
  const text = document.getElementById("c-text").value.trim();
  if (!text) return;
  (S.myComments[id] = S.myComments[id] || []).push({
    user: S.username, date: new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    text, likes: 0, replies: 0,
  });
  save(); closeModal(); render(); toast("Commento pubblicato");
}

// ---------------------------------------------------------------- liste
function viewListe() {
  return `
    ${topbar("Liste", { back: true })}
    <button class="newlist-btn" onclick="createList()">CREA UNA NUOVA LISTA</button>
    ${S.lists.map((l, i) => {
      const cover = l.items[0] ? byId(l.items[0]) : null;
      return `<div class="list-card" style="background:${cover ? posterGradient(cover.title) : "#222"}" onclick="toast('${l.items.length} titoli in “${esc(l.name)}”')">
        <button class="menu" onclick="event.stopPropagation();listMenu(${i})">•••</button>
        <div class="lname">${esc(l.name)}</div>
        <button class="priv" onclick="event.stopPropagation();S.lists[${i}].private=!S.lists[${i}].private;save();render()" title="${l.private ? "Privata" : "Pubblica"}">${l.private ? "🔒" : "🌐"}</button>
      </div>`;
    }).join("") || `<div class="empty-note">Nessuna lista. Creane una per organizzare i tuoi titoli.</div>`}
    ${bottomNav("profilo")}`;
}
function createList() {
  const name = prompt("Nome della nuova lista:");
  if (!name) return;
  S.lists.push({ name, items: [], private: true });
  save(); render();
}
function listMenu(i) {
  if (confirm(`Eliminare la lista “${S.lists[i].name}”?`)) { S.lists.splice(i, 1); save(); render(); }
}

// ---------------------------------------------------------------- profilo
function statTotals() {
  let serieMin = 0, filmMin = 0, eps = 0, films = 0;
  for (const log of S.watchLog) log.type === "serie" ? (serieMin += log.minutes, eps++) : (filmMin += log.minutes, films++);
  const split = min => ({ mesi: Math.floor(min / 43200), giorni: Math.floor(min % 43200 / 1440), ore: Math.floor(min % 1440 / 60) });
  return { serie: split(serieMin), film: split(filmMin), eps, films };
}
function viewProfilo() {
  const t = statTotals();
  const myLists = S.lists;
  const mySeries = S.added.map(byId).filter(x => x && x.type === "serie");
  const myFilms = S.added.map(byId).filter(x => x && x.type === "film");
  const favSeries = S.favorites.map(byId).filter(x => x && x.type === "serie");
  const favFilms = S.favorites.map(byId).filter(x => x && x.type === "film");
  const myCommentCount = Object.values(S.myComments).reduce((a, c) => a + c.length, 0);
  const heroBg = favSeries[0] || mySeries[0] || CATALOG[4];
  return `
    <div class="prof-hero" style="background:${posterGradient(heroBg.title)}">
      <button class="bell" onclick="toast('Nessuna notifica')">🔔</button>
      <button class="menu" onclick="go('impostazioni')">•••</button>
      <div class="who">
        <div class="avatar">👤</div>
        <div><div class="uname">${esc(S.username)}</div><button class="edit" onclick="go('impostazioni')">MODIFICA</button></div>
      </div>
    </div>
    <div class="counters">
      <div><div class="n">0</div><div class="l">following</div></div>
      <div><div class="n">0</div><div class="l">follower</div></div>
      <div><div class="n">${myCommentCount}</div><div class="l">commenti</div></div>
    </div>
    <div class="section"><div class="sec-head"><h3>Statistiche</h3><button onclick="go('statistiche')">›</button></div></div>
    <div class="statgrid">
      <div class="statbox"><div class="sb-h">📺 Tempo serie</div><div class="sb-b">
        <div class="u"><div class="n">${t.serie.mesi}</div><div class="l">MESI</div></div>
        <div class="u"><div class="n">${t.serie.giorni}</div><div class="l">GIORNI</div></div>
        <div class="u"><div class="n">${t.serie.ore}</div><div class="l">ORE</div></div></div></div>
      <div class="statbox"><div class="sb-h">📺 Episodi visti</div><div class="sb-b"><div class="u"><div class="n">${t.eps}</div></div></div></div>
      <div class="statbox"><div class="sb-h">🎬 Tempo film</div><div class="sb-b">
        <div class="u"><div class="n">${t.film.mesi}</div><div class="l">MESI</div></div>
        <div class="u"><div class="n">${t.film.giorni}</div><div class="l">GIORNI</div></div>
        <div class="u"><div class="n">${t.film.ore}</div><div class="l">ORE</div></div></div></div>
      <div class="statbox"><div class="sb-h">🎬 Film visti</div><div class="sb-b"><div class="u"><div class="n">${t.films}</div></div></div></div>
    </div>
    <div class="section"><div class="sec-head"><h3>Liste</h3><button onclick="go('liste')">›</button></div>
      ${myLists.length ? `<div class="list-card" style="background:${posterGradient((byId(myLists[0].items[0]) || { title: myLists[0].name }).title)}" onclick="go('liste')"><div class="lname">${esc(myLists[0].name)}</div></div>` : `<div class="empty-note">Nessuna lista.</div>`}
    </div>
    <div class="section"><div class="sec-head"><h3>Serie</h3><button onclick="go('browse',{kind:'serie'})">›</button></div>
      <div class="hscroll">${mySeries.map(i => poster(i, "md")).join("") || "<div class='empty-note' style='padding:10px'>Nessuna serie aggiunta.</div>"}</div></div>
    <div class="section"><div class="sec-head"><h3><span class="heart">❤️</span> Serie TV preferite</h3><button>›</button></div>
      <div class="hscroll">${favSeries.map(i => poster(i, "md")).join("") || "<div class='empty-note' style='padding:10px'>Nessuna preferita.</div>"}</div></div>
    <div class="section"><div class="sec-head"><h3>Film</h3><button onclick="go('browse',{kind:'film'})">›</button></div>
      <div class="hscroll">${myFilms.map(i => poster(i, "md")).join("") || "<div class='empty-note' style='padding:10px'>Nessun film aggiunto.</div>"}</div></div>
    <div class="section"><div class="sec-head"><h3><span class="heart">❤️</span> Film preferiti</h3><button>›</button></div>
      <div class="hscroll">${favFilms.map(i => poster(i, "md")).join("") || "<div class='empty-note' style='padding:10px'>Nessun preferito.</div>"}</div></div>
    ${bottomNav("profilo")}`;
}

// ---------------------------------------------------------------- statistiche
function barChart(values, labels) {
  const max = Math.max(...values, 1);
  return `<div class="barchart">${values.map(v => `<div class="bar"><span class="v">${v}</span><div class="b" style="height:${Math.round(v / max * 85)}%"></div></div>`).join("")}</div>
  <div class="barchart-x">${labels.map(l => `<span>${l}</span>`).join("")}</div>`;
}
function last7(kind, field) {
  const now = Date.now(), day = 86400000;
  return S.watchLog.filter(l => l.type === kind && now - l.ts < 7 * day)
    .reduce((a, l) => a + (field === "count" ? 1 : l.minutes), 0);
}
function dailySeries(kind, days, field) {
  const out = [], labels = [], now = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - d);
    const end = start.getTime() + 86400000;
    const v = S.watchLog.filter(l => l.type === kind && l.ts >= start.getTime() && l.ts < end)
      .reduce((a, l) => a + (field === "count" ? 1 : Math.round(l.minutes / 60)), 0);
    out.push(v); labels.push(start.getDate());
  }
  return [out, labels];
}
function viewStatistiche() {
  const tab = route.stab2 || "serie";
  const t = statTotals();
  const kind = tab;
  const [hours, hlabels] = dailySeries(kind, 12, "hours");
  const [counts] = dailySeries(kind, 12, "count");
  const recentEps = S.watchLog.filter(l => l.type === "serie" && Date.now() - l.ts < 60 * 86400000).length;
  const pace = (recentEps / 8.6).toFixed(2);
  const backlog = S.added.map(byId).filter(x => x && x.type === "serie").reduce((a, s) => a + remainingEpisodes(s), 0);
  const backlogHours = Math.round(backlog * 45 / 60);
  const catchupDate = recentEps > 0 && backlog > 0
    ? new Date(Date.now() + backlog / (recentEps / 60) * 86400000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const medalsWon = Object.values(S.myComments).reduce((a, c) => a + c.length, 0) > 0 ? 1 : 0;
  const tt = kind === "serie" ? t.serie : t.film;
  const months = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];
  const futureLabels = Array.from({ length: 6 }, (_, i) => months[(new Date().getMonth() + i) % 12]);
  return `
    ${topbar("Statistiche", { back: true })}
    <div class="tabs">
      <button class="${tab === "serie" ? "active" : ""}" onclick="route.stab2='serie';render()">Serie</button>
      <button class="${tab === "film" ? "active" : ""}" onclick="route.stab2='film';render()">Film</button>
    </div>
    <div class="stat-card">
      <h4>Tempo trascorso a guardare ${kind === "serie" ? "episodi" : "film"}</h4>
      <div class="bignum">${tt.mesi} <small>mesi</small> ${tt.giorni} <small>giorni</small> ${tt.ore} <small>ore</small></div>
      <div class="subnote">${Math.round(last7(kind, "minutes") / 60)} ore negli ultimi 7 giorni</div>
      <button class="compare" onclick="toast('Confronto disponibile quando segui qualcuno')">CONFRONTA CON LE PERSONE CHE SEGUI</button>
    </div>
    <div class="stat-card">
      <h4>Tempo trascorso a guardare ${kind === "serie" ? "episodi" : "film"}</h4>
      ${barChart(hours, hlabels)}
      <div class="axis-note">Alla settimana</div>
    </div>
    <div class="stat-card">
      <h4>Totale ${kind === "serie" ? "episodi" : "film"} visti</h4>
      <div class="bignum">${kind === "serie" ? t.eps : t.films}</div>
      <div class="subnote">${last7(kind, "count")} negli ultimi 7 giorni</div>
    </div>
    <div class="stat-card">
      <h4>${kind === "serie" ? "Episodi" : "Film"} visti</h4>
      ${barChart(counts, hlabels)}
    </div>
    ${kind === "serie" ? `
    <div class="stat-card">
      <h4>Quanto velocemente ti stai mettendo in pari?</h4>
      <div class="bignum">${pace} <small>episodi/settimana</small></div>
      <div class="subnote">In base agli episodi che hai visto negli ultimi due mesi</div>
    </div>
    <div class="stat-card">
      <h4>Tempo da guardare</h4>
      <div class="bignum">${backlogHours} <small>ore</small></div>
    </div>
    <div class="stat-card">
      <h4>Tempo di visione futuro</h4>
      ${barChart([backlogHours, 0, 0, 0, 0, 0], futureLabels)}
      <div class="axis-note">Ore</div>
    </div>
    <div class="stat-card">
      <h4>Quando ti metterai in pari con i tuoi episodi</h4>
      <div class="bignum">${catchupDate}</div>
      <div class="subnote">In base agli episodi che hai visto negli ultimi due mesi</div>
    </div>` : ""}
    <div class="stat-card">
      <h4>Medaglie dell'app</h4>
      <div class="bignum">${medalsWon}</div>
      <div class="medals">
        ${MEDALS.map(([e, n], i) => `<div class="medal ${i === 0 && medalsWon ? "won" : ""}">${e}<span class="mname">${n}</span></div>`).join("")}
      </div>
    </div>
    ${bottomNav("profilo")}`;
}

// ---------------------------------------------------------------- impostazioni
function viewImpostazioni() {
  const tab = route.itab || "account";
  let body = "";
  if (tab === "account") {
    body = `
    <div class="set-block">
      <h3>Identificazione <button class="save" id="save-btn" onclick="saveIdent()">SALVA</button></h3>
      <div class="set-field"><div class="fl">Nome utente</div><input id="f-user" value="${esc(S.username)}" oninput="document.getElementById('save-btn').classList.add('dirty')"></div>
      <div class="set-field"><div class="fl">Email</div><input id="f-email" value="${esc(S.email)}" oninput="document.getElementById('save-btn').classList.add('dirty')"></div>
      <div class="set-field"><div class="fl">ID utente</div><div class="ro">${esc(S.userId)}</div></div>
      <button class="set-link" onclick="toast('Cambio password (mock)')">Cambia password <span>›</span></button>
    </div>
    <div class="set-block">
      <h3>Social network</h3>
      <button class="set-link" onclick="toast('Account collegati (mock)')">Modifica gli account collegati <span>›</span></button>
    </div>
    <div class="set-block">
      <h3>Servizi Di Abbonamento</h3>
      <button class="set-link" onclick="toast('Servizi streaming (mock): alimentano “Dove guardare”')">Modifica i tuoi servizi di abbonamento <span>›</span></button>
    </div>
    <div class="set-block">
      <h3>Privacy</h3>
      <button class="set-link" onclick="toast('Privacy e note legali (mock)')">Leggi Privacy e Note legali</button>
      <div class="set-link" style="cursor:default">
        <div>Imposta il profilo come privato
          <div class="set-note">Se il tuo profilo è privato, devi approvare le richieste di chi desidera seguirti. Solo i follower possono vedere la tua attività.</div>
        </div>
        <button class="toggle ${S.privateProfile ? "on" : ""}" onclick="S.privateProfile=!S.privateProfile;save();render()"><span class="knob"></span></button>
      </div>
    </div>
    <button class="logout" onclick="logout()">ESCI</button>
    <button class="delete-acc" onclick="deleteAccount()">ELIMINA L'ACCOUNT</button>`;
  } else if (tab === "app") {
    body = `
    <div class="set-block">
      <h3>Preferenze app</h3>
      <button class="set-link" onclick="go('lingua')">Lingua dei commenti <span>›</span></button>
      <div class="set-link" style="cursor:default"><span>Notifiche push</span>
        <button class="toggle on" onclick="toast('Notifiche (mock)')"><span class="knob"></span></button></div>
    </div>`;
  } else {
    body = `<div class="empty-note">🚧<br><br>Nuove funzioni in arrivo:<br>badge stagionali, widget e altro.</div>`;
  }
  return `
    ${topbar("Impostazioni", { back: true })}
    <div class="tabs">
      ${["account", "app", "in arrivo"].map(t => `<button class="${tab === t ? "active" : ""}" onclick="route.itab='${t}';render()">${t}</button>`).join("")}
    </div>
    ${body}
    ${bottomNav("profilo")}`;
}
function saveIdent() {
  S.username = document.getElementById("f-user").value.trim() || S.username;
  S.email = document.getElementById("f-email").value.trim() || S.email;
  save(); render(); toast("Profilo salvato");
}
function logout() {
  S.loggedIn = false; save();
  routeStack.length = 0;
  go("login", {}, false);
}
function deleteAccount() {
  if (!confirm("Eliminare definitivamente l'account e tutti i dati locali?")) return;
  localStorage.removeItem("tvstreamy");
  S = loadState();
  routeStack.length = 0;
  go("login", {}, false);
}

// ---------------------------------------------------------------- lingua commenti
function viewLingua() {
  return `
    ${topbar("Lingua dei commenti", { back: true })}
    <div class="lang-head">Mostra i commenti nelle lingue seguenti:</div>
    ${LANGUAGES.map(l => `
      <label class="lang-row" onclick="toggleLang('${l}')">
        <span class="cbx ${S.langs.includes(l) ? "on" : ""}">${S.langs.includes(l) ? "✓" : ""}</span> ${l}
      </label>`).join("")}
    <div style="height:80px"></div>`;
}
function toggleLang(l) {
  S.langs.includes(l) ? S.langs = S.langs.filter(x => x !== l) : S.langs.push(l);
  save(); render();
}

// ---------------------------------------------------------------- avvio (demo: precarica una libreria se vuota)
if (S.loggedIn && !S.added.length) S.added = ["hotd"];
render();
