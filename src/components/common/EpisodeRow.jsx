import { posterGradient, pad2 } from "../../utils/format.js";

// Riga episodio riusata da watchlist (con badge serie) e dettaglio serie (elenco puntate).
export default function EpisodeRow({ thumbLabel, thumbSeed, badge, onBadgeClick, season, episode, extra, title, done, onCheck }) {
  return (
    <div className="ep-row">
      <div className="thumb" style={{ background: posterGradient(thumbSeed) }}>
        {thumbLabel}
      </div>
      <div className="meta">
        {badge && (
          <button className="show-badge" onClick={onBadgeClick}>
            {badge} ›
          </button>
        )}
        <div className="epnum">
          S{pad2(season)} | E{pad2(episode)} {extra > 0 && <span className="more">+{extra}</span>}
        </div>
        <div className="eptitle">{title}</div>
      </div>
      <button className={`checkbtn ${done ? "done" : ""}`} onClick={onCheck}>
        ✓
      </button>
    </div>
  );
}
