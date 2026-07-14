import { useState } from "react";
import BottomNav from "../components/layout/BottomNav.jsx";
import Tabs from "../components/layout/Tabs.jsx";
import FilterSheet from "../components/modals/FilterSheet.jsx";
import { QuickAddButton } from "../components/common/Poster.jsx";
import { CATALOG } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { posterGradient, typeIcon } from "../utils/format.js";

const CHIP_TABS = ["feed", "scopri", "gruppi", "attività"];
const DEFAULT_FILTERS = { sort: "trending", genres: [], includeAdded: false };

function Feed() {
  const nav = useNav();
  const feed = [...CATALOG].sort((a, b) => b.added - a.added).slice(0, 10);
  return feed.map(item => (
    <div className="feed-card" key={item.id}>
      <div
        className="hero"
        style={{ background: posterGradient(item.title) }}
        onClick={() => nav.go("detail", { id: item.id })}
      >
        <QuickAddButton id={item.id} />
        <div className="label">
          <h4>
            {typeIcon(item.type)} {item.title}
          </h4>
          <div className="sub">
            {item.runtime ? `${item.runtime} • ` : ""}
            {item.genres.join(", ")}
          </div>
        </div>
      </div>
      <div className="desc">{item.overview}</div>
    </div>
  ));
}

function Discover() {
  const { S } = useApp();
  const nav = useNav();
  const [kind, setKind] = useState("film");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  let items = CATALOG.filter(x => x.type === kind);
  if (!filters.includeAdded) items = items.filter(x => !S.added.includes(x.id));
  if (filters.genres.length) items = items.filter(x => x.genres.some(g => filters.genres.includes(g)));
  items.sort((a, b) => (filters.sort === "trending" ? b.votes - a.votes : b.added - a.added));

  return (
    <>
      <Tabs tabs={[["serie", "Serie"], ["film", "Film"]]} active={kind} onChange={setKind} />
      {items.map(item => (
        <div
          className="disc-card"
          key={item.id}
          style={{ background: posterGradient(item.title) }}
          onClick={() => nav.go("detail", { id: item.id })}
        >
          <QuickAddButton id={item.id} />
          <div className="label">
            <h4>{item.title}</h4>
            <div className="sub">{item.genres.join(", ")}</div>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="empty-note">Nessun risultato con i filtri attivi.</div>}
      <button className="filter-fab" onClick={() => setShowFilters(true)}>
        ⚙
      </button>
      {showFilters && (
        <FilterSheet
          filters={filters}
          onApply={f => { setFilters(f); setShowFilters(false); }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </>
  );
}

export default function Explore() {
  const { route, setParams, go } = useNav();
  const tab = route.tab || "feed";

  const body = {
    feed: <Feed />,
    scopri: <Discover />,
    gruppi: (
      <div className="empty-note">
        💬<br /><br />I gruppi ti permettono di commentare le serie con altri fan.<br />Nessun gruppo seguito per ora.
      </div>
    ),
    attività: (
      <div className="empty-note">
        🔔<br /><br />Qui vedrai l'attività delle persone che segui:<br />episodi visti, valutazioni e commenti.
      </div>
    ),
  }[tab];

  return (
    <>
      <div className="searchbar">
        <div className="field">
          🔍 <input placeholder="Cerca" onFocus={() => go("search")} readOnly />
        </div>
      </div>
      <div className="chips">
        {CHIP_TABS.map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setParams({ tab: t })}>
            {t}
          </button>
        ))}
      </div>
      {body}
      <BottomNav active="esplora" />
    </>
  );
}
