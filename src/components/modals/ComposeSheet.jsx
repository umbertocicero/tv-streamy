import { useState } from "react";
import Sheet from "../common/Sheet.jsx";

export default function ComposeSheet({ onSubmit, onClose }) {
  const [text, setText] = useState("");
  return (
    <Sheet onClose={onClose}>
      <div className="sheet compose-box">
        <h3 style={{ padding: "0 0 12px" }}>Scrivi un commento</h3>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Cosa ne pensi? (occhio agli spoiler…)"
        />
        <button className="send" onClick={() => text.trim() && onSubmit(text.trim())}>
          PUBBLICA
        </button>
      </div>
    </Sheet>
  );
}
