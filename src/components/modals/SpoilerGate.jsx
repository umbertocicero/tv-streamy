import Sheet from "../common/Sheet.jsx";

// Barriera anti-spoiler: chiede conferma prima di mostrare i commenti di un titolo non visto.
export default function SpoilerGate({ item, onShowAnyway, onMarkSeen, onClose }) {
  return (
    <Sheet center onClose={onClose}>
      <div className="spoiler-box">
        <h3>Spoiler a seguire!</h3>
        <p>Non hai ancora visto questo {item.type}. Vuoi davvero leggere i commenti?</p>
        <div className="btns">
          <button onClick={onShowAnyway}>MOSTRA COMUNQUE</button>
          <button onClick={onMarkSeen}>HO VISTO QUESTO {item.type === "film" ? "FILM" : "SHOW"}</button>
          <button onClick={onClose}>ANNULLA</button>
        </div>
      </div>
    </Sheet>
  );
}
