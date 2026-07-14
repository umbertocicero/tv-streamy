import { useState } from "react";
import Tabs from "../components/layout/Tabs.jsx";
import Poster from "../components/common/Poster.jsx";
import EpisodeRow from "../components/common/EpisodeRow.jsx";
import ActionSheet from "../components/modals/ActionSheet.jsx";
import SpoilerGate from "../components/modals/SpoilerGate.jsx";
import { CATALOG, byId } from "../data/catalog.js";
import { EMOJI_REACTIONS, STAR_LABELS, POLL_OPTIONS } from "../data/constants.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { posterGradient, starsInline, fmtCount } from "../utils/format.js";
import { titleSeen, epKey } from "../utils/library.js";

const WHERE_OPTIONS = [
  ["theater", "🎦", "Theater"],
  ["altro", "⭕", "Altro"],
  ["non-ufficiale", "🏴‍☠️", "Servizio non uffic…"],
];

function SeasonsBlock({ serie }) {
  const { S, toggleEpisode } = useApp();
  return (
    <>
      <div className="section"><h3>Episodi</h3></div>
      {serie.seasons.map(season =>
        season.eps.map((title, i) => (
          <EpisodeRow
            key={`${season.n}-${i}`}
            thumbLabel={`S${season.n}E${i + 1}`}
            thumbSeed={serie.title + season.n + i}
            season={season.n}
            episode={i + 1}
            title={title}
            done={!!S.watched[epKey(serie.id, season.n, i + 1)]}
            onCheck={() => toggleEpisode(serie.id, season.n, i + 1)}
          />
        ))
      )}
    </>
  );
}

function InfoTab({ item, commentCount, onOpenComments }) {
  const { S, setPoll } = useApp();
  const toast = useToast();
  const related = CATALOG.filter(
    x => x.id !== item.id && x.type === item.type && x.genres.some(g => item.genres.includes(g))
  ).slice(0, 10);

  return (
    <>
      <div className="card">
        <div className="row-between">
          <h3>Dove guardare</h3>
          <button onClick={() => toast("Configura i tuoi servizi di streaming in Impostazioni")}>⚙️</button>
        </div>
        <div style={{ color: "var(--fg-dim)", fontSize: 14 }}>Non disponibile</div>
      </div>
      <div className="card">
        <h3>Informazioni {item.type}</h3>
        <div className="rating-line">
          <span className="tlogo">T</span>
          <span className="stars-inline">{starsInline(item.rating)}</span>
          <b>{item.rating}/5</b>
          <span style={{ color: "var(--fg-dim)" }}>{item.votes.toLocaleString("it-IT")} voti</span>
        </div>
        <div className="overview">{item.overview}</div>
        <div className="trailer" onClick={() => toast("Riproduzione trailer (mock)")}>
          <div className="thumb">▶️</div>
          <div>
            <b>Guarda il trailer</b>
            <div style={{ color: "var(--fg-dim)", fontSize: 13, marginTop: 3 }}>{item.trailer}</div>
          </div>
        </div>
      </div>
      <div className="social-count">
        👥 {fmtCount(item.added + (S.added.includes(item.id) ? 1 : 0))} hanno aggiunto{" "}
        {item.type === "film" ? "questo film" : "questa serie"}
      </div>
      <div className="section cast-scroll">
        <h3>Cast</h3>
        <div className="hscroll" style={{ marginTop: 10 }}>
          {item.cast.map(([actor, character]) => (
            <div className="castcard" key={actor}>
              <div className="face" style={{ background: posterGradient(actor) }}>👤</div>
              <div className="aname">{actor}</div>
              <div className="cname">{character}</div>
            </div>
          ))}
        </div>
      </div>
      {item.type === "serie" && <SeasonsBlock serie={item} />}
      <div className="section">
        <h3>Gli altri hanno visto anche</h3>
        <div className="hscroll" style={{ marginTop: 10 }}>
          {related.map(r => (
            <Poster key={r.id} item={r} size="md" withAdd />
          ))}
        </div>
      </div>
      <div className="poll">
        <div className="q">Cosa ti interessa di più di questo {item.type}?</div>
        {POLL_OPTIONS.map(option => (
          <button
            key={option}
            className={S.polls[item.id] === option ? "sel" : ""}
            onClick={() => setPoll(item.id, option)}
          >
            {option}
          </button>
        ))}
      </div>
      <button className="comments-link" style={{ width: "100%" }} onClick={onOpenComments}>
        <span>Commenti</span>
        <span>{commentCount} ›</span>
      </button>
    </>
  );
}

function AltroTab({ item, commentCount, onOpenComments }) {
  const { S, setWhere, rateTitle, setReaction } = useApp();
  const toast = useToast();
  return (
    <>
      <div className="altro-box">
        <div className="q">Dove l'hai visto?</div>
        <div className="wherewatched">
          {WHERE_OPTIONS.map(([key, icon, label]) => (
            <button
              key={key}
              className={S.wheres[item.id] === key ? "sel" : ""}
              onClick={() => setWhere(item.id, key)}
            >
              <span className="icobox">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="altro-box">
        <div className="q">Valuta questo {item.type}</div>
        <div className="starrate">
          {STAR_LABELS.map((label, i) => (
            <button
              key={label}
              className={`s ${(S.ratings[item.id] || 0) > i ? "on" : ""}`}
              onClick={() => { rateTitle(item.id, i + 1); toast(`Valutato: ${label}`); }}
            >
              <span className="glyph">★</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="altro-box">
        <div className="q">Che impressione hai avuto?</div>
        <div className="emoji-grid">
          {EMOJI_REACTIONS.map(([emoji, label], i) => (
            <button
              key={label}
              className={S.reactions[item.id] === i ? "sel" : ""}
              onClick={() => setReaction(item.id, i)}
            >
              <span className="e">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <button className="comments-pill" onClick={onOpenComments}>
          {commentCount} COMMENTI →
        </button>
      </div>
    </>
  );
}

export default function Detail() {
  const { S, toggleAdd, toggleWatched } = useApp();
  const nav = useNav();
  const toast = useToast();
  const [tab, setTab] = useState("info");
  const [showActions, setShowActions] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);

  const item = byId(nav.route.id);
  if (!item) return null;

  const seen = titleSeen(S, item);
  const added = S.added.includes(item.id);
  const commentCount = item.comments + (S.myComments[item.id] || []).length;

  const openComments = () => {
    if (seen) nav.go("comments", { id: item.id });
    else setShowSpoiler(true);
  };

  return (
    <>
      <div className="detail-hero" style={{ background: posterGradient(item.title) }}>
        <button className="close" onClick={nav.back}>⌄</button>
        <button className="menu" onClick={() => setShowActions(true)}>•••</button>
        <div className="grad"></div>
        <div className="label">
          <h1>{item.title}</h1>
          <div className="genres">{item.genres.join(", ")}</div>
        </div>
      </div>
      <div className="detail-meta">
        <span>📅 {item.releaseDate || item.year}</span>
        <span>👁 {seen ? "Visto" : "Non visto"}</span>
        <span className="spacer"></span>
        <button className={`checkbtn ${seen ? "done" : ""}`} onClick={() => toggleWatched(item.id)}>
          ✓
        </button>
      </div>
      <Tabs tabs={[["info", "Info"], ["altro", "Altro"]]} active={tab} onChange={setTab} />
      {tab === "info" ? (
        <InfoTab item={item} commentCount={commentCount} onOpenComments={openComments} />
      ) : (
        <AltroTab item={item} commentCount={commentCount} onOpenComments={openComments} />
      )}
      <div style={{ height: 80 }}></div>
      <button
        className={`addfilm ${added ? "remove" : ""}`}
        onClick={() => {
          toggleAdd(item.id);
          toast(added ? "Rimosso dalla libreria" : "Aggiunto alla libreria");
        }}
      >
        {added ? "✓ NELLA TUA LIBRERIA — TOCCA PER RIMUOVERE" : `+ AGGIUNGI ${item.type.toUpperCase()}`}
      </button>
      {showActions && <ActionSheet item={item} onClose={() => setShowActions(false)} />}
      {showSpoiler && (
        <SpoilerGate
          item={item}
          onShowAnyway={() => { setShowSpoiler(false); nav.go("comments", { id: item.id }); }}
          onMarkSeen={() => { setShowSpoiler(false); toggleWatched(item.id); nav.go("comments", { id: item.id }); }}
          onClose={() => setShowSpoiler(false)}
        />
      )}
    </>
  );
}
