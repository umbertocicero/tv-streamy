import { useNav } from "../../state/NavContext.jsx";

const ITEMS = [
  ["serie", "📺", "Serie"],
  ["film", "🎬", "Film"],
  ["esplora", "🔍", "Esplora"],
  ["profilo", "👤", "Profilo"],
];

export default function BottomNav({ active }) {
  const nav = useNav();
  return (
    <nav className="bottomnav">
      {ITEMS.map(([view, icon, label]) => (
        <button
          key={view}
          className={active === view ? "active" : ""}
          onClick={() => nav.reset(view)}
        >
          <span className="ico">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}
