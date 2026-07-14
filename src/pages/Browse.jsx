import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Poster from "../components/common/Poster.jsx";
import { CATALOG } from "../data/catalog.js";
import { useNav } from "../state/NavContext.jsx";

export default function Browse() {
  const { route } = useNav();
  const kind = route.kind || "serie";
  const items = CATALOG.filter(x => x.type === kind);
  return (
    <>
      <TopBar title={kind === "serie" ? "Tutte le serie" : "Tutti i film"} back />
      <div className="grid" style={{ marginTop: 12 }}>
        {items.map(item => (
          <Poster key={item.id} item={item} withAdd />
        ))}
      </div>
      <BottomNav active={kind} />
    </>
  );
}
