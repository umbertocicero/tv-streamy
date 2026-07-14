import { useState } from "react";
import TopBar from "../components/layout/TopBar.jsx";
import ComposeSheet from "../components/modals/ComposeSheet.jsx";
import { byId } from "../data/catalog.js";
import { commentsFor } from "../data/comments.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { avatarColor, posterGradient } from "../utils/format.js";

function Comment({ item, comment, index }) {
  const { S, toggleLikeComment } = useApp();
  const toast = useToast();
  const liked = !!S.likedComments[`${item.id}:${index}`];
  return (
    <div className="comment">
      <div className="chead">
        <div className="avatar" style={{ background: avatarColor(comment.user) }}>
          {comment.user[0].toUpperCase()}
        </div>
        <div>
          <div className="cuser">{comment.user}</div>
          <div className="cdate">{comment.date}</div>
        </div>
        <button className="flag" onClick={() => toast("Commento segnalato")}>⚑</button>
      </div>
      <div className="ctext">{comment.text}</div>
      {comment.img && (
        <div className="cimg" style={{ background: posterGradient(comment.text) }}>
          {comment.img}
        </div>
      )}
      <div className="cactions">
        <button className={liked ? "liked" : ""} onClick={() => toggleLikeComment(item.id, index)}>
          {liked ? "❤️" : "🤍"} {(comment.likes + (liked ? 1 : 0)).toLocaleString("it-IT")}
        </button>
        <button onClick={() => toast("Risposte (mock)")}>💬 {comment.replies || 0}</button>
        <button className="share" onClick={() => toast("Commento condiviso (mock)")}>↑</button>
      </div>
    </div>
  );
}

export default function Comments() {
  const { S, addComment } = useApp();
  const nav = useNav();
  const toast = useToast();
  const [composing, setComposing] = useState(false);

  const item = byId(nav.route.id);
  if (!item) return null;
  const all = commentsFor(item.id, S.myComments);
  const total = item.comments + (S.myComments[item.id] || []).length;

  return (
    <>
      <TopBar title={item.title} sub={`${total} commenti`} back />
      <div className="sortline">
        <span className="lab">ORDINA PER</span>
        <span className="val">I più rilevanti</span>
        <button className="gear" onClick={() => nav.go("lingua")}>⚙</button>
      </div>
      {all.map((comment, i) => (
        <Comment key={i} item={item} comment={comment} index={i} />
      ))}
      <div style={{ height: 90 }}></div>
      <button className="fab-compose" onClick={() => setComposing(true)}>✏️</button>
      {composing && (
        <ComposeSheet
          onSubmit={text => { addComment(item.id, text); setComposing(false); toast("Commento pubblicato"); }}
          onClose={() => setComposing(false)}
        />
      )}
    </>
  );
}
