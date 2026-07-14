import Sheet from "../common/Sheet.jsx";
import { useApp } from "../../state/AppStateContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { titleSeen } from "../../utils/library.js";

// Menu azioni rapide sul titolo: personalizza, preferito, liste, rimozione, condivisione.
export default function ActionSheet({ item, onClose }) {
  const { S, toggleFav, addToList, removeTitle } = useApp();
  const toast = useToast();
  const fav = S.favorites.includes(item.id);

  const handleAddToList = () => {
    onClose();
    if (!S.lists.length) return toast("Crea prima una lista dal profilo");
    const list = S.lists[0];
    if (list.items.includes(item.id)) return toast(`Già presente in “${list.name}”`);
    addToList(0, item.id);
    toast(`Aggiunto a “${list.name}”`);
  };

  const handleShare = () => {
    onClose();
    if (navigator.share)
      navigator.share({ title: item.title, text: `Guarda “${item.title}” su TV Streamy!` }).catch(() => {});
    else toast("Link copiato (mock)");
  };

  return (
    <Sheet onClose={onClose}>
      <div className="action-sheet">
        <div className="state">{titleSeen(S, item) ? "Visto" : "Non visto"}</div>
        <button onClick={() => { onClose(); toast("Personalizzazione poster e traccia (mock)"); }}>
          <span className="ico">✏️</span> Personalizza
        </button>
        <button onClick={() => { toggleFav(item.id); onClose(); toast(fav ? "Rimosso dai preferiti" : "Aggiunto ai preferiti ❤️"); }}>
          <span className="ico">{fav ? "❤️" : "🤍"}</span> Preferito
        </button>
        <button onClick={handleAddToList}>
          <span className="ico">➕</span> Aggiungi alla lista
        </button>
        <button onClick={() => { removeTitle(item.id); onClose(); toast("Rimosso dalla libreria"); }}>
          <span className="ico">➖</span> Rimuovi {item.type === "film" ? "il film" : "la serie"}
        </button>
        <button onClick={handleShare}>
          <span className="ico">↑</span> Condividi
        </button>
      </div>
    </Sheet>
  );
}
