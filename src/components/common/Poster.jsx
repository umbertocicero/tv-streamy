import { useApp } from "../../state/AppStateContext.jsx";
import { useNav } from "../../state/NavContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { posterGradient } from "../../utils/format.js";

export function QuickAddButton({ id, inline = false }) {
  const { S, toggleAdd } = useApp();
  const toast = useToast();
  const added = S.added.includes(id);
  return (
    <button
      className={`qadd ${added ? "added" : ""}`}
      style={inline ? { position: "static" } : undefined}
      onClick={e => {
        e.stopPropagation();
        toggleAdd(id);
        toast(added ? "Rimosso dalla libreria" : "Aggiunto alla libreria");
      }}
    >
      {added ? "✓" : "+"}
    </button>
  );
}

export default function Poster({ item, size = "", withAdd = false }) {
  const nav = useNav();
  return (
    <div
      className={`poster ${size}`}
      style={{ background: posterGradient(item.title) }}
      onClick={() => nav.go("detail", { id: item.id })}
    >
      {withAdd && <QuickAddButton id={item.id} />}
      <span>{item.title}</span>
    </div>
  );
}
