import Tabs from "../components/layout/Tabs.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Poster from "../components/common/Poster.jsx";
import EpisodeRow from "../components/common/EpisodeRow.jsx";
import { CATALOG, byId } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { nextEpisode, watchedEpisodes } from "../utils/library.js";
import { pad2 } from "../utils/format.js";

function Watchlist() {
  const { S, toggleEpisode } = useApp();
  const nav = useNav();
  const toast = useToast();
  const mySeries = S.added.map(byId).filter(x => x && x.type === "serie");
  const rows = mySeries
    .map(serie => ({ serie, next: nextEpisode(S, serie) }))
    .filter(({ next }) => next);

  return (
    <>
      {rows.length === 0 && (
        <div className="empty-note">
          Nessuna serie da vedere.
          <br />
          Aggiungi serie dal catalogo per iniziare a tracciarle.
        </div>
      )}
      {rows.map(({ serie, next }) => (
        <div key={serie.id}>
          <div className="state-badge">{watchedEpisodes(S, serie) > 0 ? "In corso" : "Non iniziato"}</div>
          <EpisodeRow
            thumbLabel={serie.title}
            thumbSeed={serie.title}
            badge={serie.title}
            onBadgeClick={() => nav.go("detail", { id: serie.id })}
            season={next.s}
            episode={next.e}
            extra={next.remaining - 1}
            title={next.title}
            done={false}
            onCheck={() => {
              toggleEpisode(serie.id, next.s, next.e);
              toast(`S${pad2(next.s)} E${pad2(next.e)} segnato come visto`);
            }}
          />
        </div>
      ))}
      <button className="browse-btn" onClick={() => nav.go("browse", { kind: "serie" })}>
        SFOGLIA TUTTE LE SERIE
      </button>
    </>
  );
}

function Upcoming() {
  const { S } = useApp();
  const upcoming = CATALOG.filter(x => x.type === "serie" && !S.added.includes(x.id));
  return (
    <>
      <div className="section">
        <div className="hscroll">
          {upcoming.map(item => (
            <Poster key={item.id} item={item} size="md" withAdd />
          ))}
        </div>
      </div>
      <div className="empty-note">Le nuove uscite delle tue serie appariranno qui.</div>
    </>
  );
}

export default function Series() {
  const { route, setParams } = useNav();
  const tab = route.tab || "watchlist";
  return (
    <>
      <Tabs
        variant="top"
        tabs={[["watchlist", "Lista di cose da vedere"], ["inarrivo", "In arrivo"]]}
        active={tab}
        onChange={t => setParams({ tab: t })}
      />
      {tab === "watchlist" ? <Watchlist /> : <Upcoming />}
      <BottomNav active="serie" />
    </>
  );
}
