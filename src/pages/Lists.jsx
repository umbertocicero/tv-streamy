import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import { byId } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { posterGradient } from "../utils/format.js";

export default function Lists() {
  const { S, createList, deleteList, toggleListPrivacy } = useApp();
  const toast = useToast();

  const handleCreate = () => {
    const name = prompt("Nome della nuova lista:");
    if (name) createList(name);
  };

  return (
    <>
      <TopBar title="Liste" back />
      <button className="newlist-btn" onClick={handleCreate}>
        CREA UNA NUOVA LISTA
      </button>
      {S.lists.length === 0 && (
        <div className="empty-note">Nessuna lista. Creane una per organizzare i tuoi titoli.</div>
      )}
      {S.lists.map((list, i) => {
        const cover = list.items[0] ? byId(list.items[0]) : null;
        return (
          <div
            className="list-card"
            key={i}
            style={{ background: cover ? posterGradient(cover.title) : "#222" }}
            onClick={() => toast(`${list.items.length} titoli in “${list.name}”`)}
          >
            <button
              className="menu"
              onClick={e => {
                e.stopPropagation();
                if (confirm(`Eliminare la lista “${list.name}”?`)) deleteList(i);
              }}
            >
              •••
            </button>
            <div className="lname">{list.name}</div>
            <button
              className="priv"
              title={list.private ? "Privata" : "Pubblica"}
              onClick={e => { e.stopPropagation(); toggleListPrivacy(i); }}
            >
              {list.private ? "🔒" : "🌐"}
            </button>
          </div>
        );
      })}
      <BottomNav active="profilo" />
    </>
  );
}
