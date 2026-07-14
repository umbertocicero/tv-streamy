import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Poster from "../components/common/Poster.jsx";
import { byId } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { isWatched } from "../utils/library.js";

export default function Movies() {
  const { S } = useApp();
  const nav = useNav();
  const myFilms = S.added.map(byId).filter(x => x && x.type === "film");
  const toWatch = myFilms.filter(f => !isWatched(S, f.id));
  const seen = myFilms.filter(f => isWatched(S, f.id));

  const grid = items => (
    <div className="grid">
      {items.map(item => (
        <Poster key={item.id} item={item} withAdd />
      ))}
    </div>
  );

  return (
    <>
      <TopBar title="Film" />
      {toWatch.length > 0 && (
        <>
          <div className="section"><h3>Da vedere</h3></div>
          {grid(toWatch)}
        </>
      )}
      {seen.length > 0 && (
        <>
          <div className="section"><h3>Visti</h3></div>
          {grid(seen)}
        </>
      )}
      {myFilms.length === 0 && (
        <div className="empty-note">
          Nessun film in libreria.
          <br />
          Cerca un film e aggiungilo con +.
        </div>
      )}
      <button className="browse-btn" onClick={() => nav.go("browse", { kind: "film" })}>
        SFOGLIA TUTTI I FILM
      </button>
      <BottomNav active="film" />
    </>
  );
}
