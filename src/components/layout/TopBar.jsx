import { useNav } from "../../state/NavContext.jsx";

export default function TopBar({ title, sub, back, right }) {
  const nav = useNav();
  return (
    <header className="topbar">
      {back && (
        <button className="back" onClick={nav.back}>
          ‹
        </button>
      )}
      <div className="title-wrap">
        {title}
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right && <div className="right">{right}</div>}
    </header>
  );
}
