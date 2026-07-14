import { useState } from "react";
import Sheet from "../common/Sheet.jsx";
import Toggle from "../common/Toggle.jsx";
import { GENRES } from "../../data/catalog.js";
import { posterGradient } from "../../utils/format.js";

const EMPTY = { sort: "trending", genres: [], includeAdded: false };

// Il foglio lavora su una bozza locale: i filtri si applicano solo con APPLICA.
export default function FilterSheet({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);

  const toggleGenre = g =>
    setDraft(d => ({
      ...d,
      genres: d.genres.includes(g) ? d.genres.filter(x => x !== g) : [...d.genres, g],
    }));

  return (
    <Sheet onClose={onClose}>
      <div className="sheet">
        <h3>Sort by</h3>
        <div className="sortrow">
          <button
            className={draft.sort === "trending" ? "active" : ""}
            onClick={() => setDraft(d => ({ ...d, sort: "trending" }))}
          >
            Trending
          </button>
          <button
            className={draft.sort === "added" ? "active" : ""}
            onClick={() => setDraft(d => ({ ...d, sort: "added" }))}
          >
            Most added
          </button>
        </div>
        <h3>Genres</h3>
        <div className="genre-grid">
          {GENRES.map(g => (
            <button
              key={g}
              className={`genre-tile ${draft.genres.includes(g) ? "sel" : ""}`}
              style={{ background: posterGradient(g) }}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <h3>Avanzati</h3>
        <div className="advrow">
          <span>Include added movies</span>
          <Toggle on={draft.includeAdded} onChange={() => setDraft(d => ({ ...d, includeAdded: !d.includeAdded }))} />
        </div>
        <div className="actions">
          <button className="reset" onClick={() => setDraft({ ...EMPTY })}>
            REIMPOSTA
          </button>
          <button className="apply" onClick={() => onApply(draft)}>
            APPLICA
          </button>
        </div>
      </div>
    </Sheet>
  );
}
