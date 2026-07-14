import BottomNav from "../components/layout/BottomNav.jsx";
import Poster from "../components/common/Poster.jsx";
import { CATALOG, byId } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { posterGradient } from "../utils/format.js";
import { statTotals } from "../utils/library.js";

function StatBox({ icon, label, units }) {
  return (
    <div className="statbox">
      <div className="sb-h">{icon} {label}</div>
      <div className="sb-b">
        {units.map(([n, l]) => (
          <div className="u" key={l || "n"}>
            <div className="n">{n}</div>
            {l && <div className="l">{l}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Shelf({ title, heart, items, onMore, emptyText }) {
  return (
    <div className="section">
      <div className="sec-head">
        <h3>{heart && <span className="heart">❤️</span>} {title}</h3>
        <button onClick={onMore}>›</button>
      </div>
      <div className="hscroll">
        {items.length
          ? items.map(item => <Poster key={item.id} item={item} size="md" />)
          : <div className="empty-note" style={{ padding: 10 }}>{emptyText}</div>}
      </div>
    </div>
  );
}

export default function Profile() {
  const { S } = useApp();
  const nav = useNav();
  const toast = useToast();
  const t = statTotals(S);

  const mySeries = S.added.map(byId).filter(x => x && x.type === "serie");
  const myFilms = S.added.map(byId).filter(x => x && x.type === "film");
  const favSeries = S.favorites.map(byId).filter(x => x && x.type === "serie");
  const favFilms = S.favorites.map(byId).filter(x => x && x.type === "film");
  const myCommentCount = Object.values(S.myComments).reduce((a, c) => a + c.length, 0);
  const heroBg = favSeries[0] || mySeries[0] || CATALOG[4];
  const firstList = S.lists[0];

  const timeUnits = tt => [[tt.mesi, "MESI"], [tt.giorni, "GIORNI"], [tt.ore, "ORE"]];

  return (
    <>
      <div className="prof-hero" style={{ background: posterGradient(heroBg.title) }}>
        <button className="bell" onClick={() => toast("Nessuna notifica")}>🔔</button>
        <button className="menu" onClick={() => nav.go("impostazioni")}>•••</button>
        <div className="who">
          <div className="avatar">👤</div>
          <div>
            <div className="uname">{S.username}</div>
            <button className="edit" onClick={() => nav.go("impostazioni")}>MODIFICA</button>
          </div>
        </div>
      </div>
      <div className="counters">
        <div><div className="n">0</div><div className="l">following</div></div>
        <div><div className="n">0</div><div className="l">follower</div></div>
        <div><div className="n">{myCommentCount}</div><div className="l">commenti</div></div>
      </div>
      <div className="section">
        <div className="sec-head">
          <h3>Statistiche</h3>
          <button onClick={() => nav.go("statistiche")}>›</button>
        </div>
      </div>
      <div className="statgrid">
        <StatBox icon="📺" label="Tempo serie" units={timeUnits(t.serie)} />
        <StatBox icon="📺" label="Episodi visti" units={[[t.eps, ""]]} />
        <StatBox icon="🎬" label="Tempo film" units={timeUnits(t.film)} />
        <StatBox icon="🎬" label="Film visti" units={[[t.films, ""]]} />
      </div>
      <div className="section">
        <div className="sec-head">
          <h3>Liste</h3>
          <button onClick={() => nav.go("liste")}>›</button>
        </div>
        {firstList ? (
          <div
            className="list-card"
            style={{ background: posterGradient((byId(firstList.items[0]) || { title: firstList.name }).title) }}
            onClick={() => nav.go("liste")}
          >
            <div className="lname">{firstList.name}</div>
          </div>
        ) : (
          <div className="empty-note">Nessuna lista.</div>
        )}
      </div>
      <Shelf title="Serie" items={mySeries} onMore={() => nav.go("browse", { kind: "serie" })} emptyText="Nessuna serie aggiunta." />
      <Shelf title="Serie TV preferite" heart items={favSeries} onMore={() => {}} emptyText="Nessuna preferita." />
      <Shelf title="Film" items={myFilms} onMore={() => nav.go("browse", { kind: "film" })} emptyText="Nessun film aggiunto." />
      <Shelf title="Film preferiti" heart items={favFilms} onMore={() => {}} emptyText="Nessun preferito." />
      <BottomNav active="profilo" />
    </>
  );
}
