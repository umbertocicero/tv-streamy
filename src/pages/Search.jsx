import { useState, useEffect } from “react”;
import Tabs from “../components/layout/Tabs.jsx”;
import { QuickAddButton } from “../components/common/Poster.jsx”;
import { useNav } from “../state/NavContext.jsx”;
import { useSearch } from “../hooks/useSearch.js”;
import { posterGradient, fmtCount, typeIcon } from “../utils/format.js”;

export default function Search() {
  const nav = useNav();
  const [q, setQ] = useState(“”);
  const [tab, setTab] = useState(“titoli”);
  const { results, loading, search } = useSearch();

  // Cerca quando l'input cambia (debounce di 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q.trim().length >= 2) {
        search(q);
      } else {
        search(“”); // Resetta i risultati
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, search]);

  const items = results;

  return (
    <>
      <div className=”searchbar”>
        <div className=”field”>
          🔍 <input autoFocus placeholder=”Cerca serie e film” value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className=”cancel” onClick={nav.back}>
          Annulla
        </button>
      </div>
      <Tabs
        tabs={[[“titoli”, “Serie e film”], [“utenti”, “Utenti”], [“gruppi”, “Gruppi”]]}
        active={tab}
        onChange={setTab}
      />
      {tab === “titoli” &&
        (loading ? (
          <div style={{ padding: “20px” }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className=”skeleton” style={{ height: “80px”, marginBottom: “8px”, borderRadius: “6px” }} />
            ))}
          </div>
        ) : items.length ? (
          items.map(item => (
            <div className=”result-row” key={item.id} onClick={() => nav.go(“detail”, { id: item.id })}>
              <div className=”poster sm” style={{ background: posterGradient(item.title) }}>
                <span>{item.title}</span>
              </div>
              <div className=”meta”>
                <div className=”rtitle”>{item.title}</div>
                <div className=”rsub”>
                  {typeIcon(item.type)} {fmtCount(item.added)} hanno aggiunto{“ “}
                  {item.type === “film” ? “questo film” : “questa serie”}
                </div>
              </div>
              <QuickAddButton id={item.id} inline />
            </div>
          ))
        ) : (
          <div className=”empty-note”>
            {q.trim().length < 2 ? “Digita almeno 2 caratteri per cercare” : `Nessun titolo trovato per “${q}”.`}
          </div>
        ))}
      {tab === "utenti" && <div className="empty-note">Cerca altri utenti per nome per seguirli.</div>}
      {tab === "gruppi" && <div className="empty-note">Cerca gruppi di discussione sulle tue serie.</div>}
    </>
  );
}
