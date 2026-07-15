import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar.jsx";
import ComposeSheet from "../components/modals/ComposeSheet.jsx";
import { byId } from "../data/catalog.js";
import { SEED_COMMENTS } from "../data/comments.js";
import { backend } from "../api/backend.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { avatarColor } from "../utils/format.js";

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function Comment({ comment, onLike, onReply, onReport, onLoadReplies, replies, isReply = false }) {
  return (
    <div className="comment" style={isReply ? { marginLeft: 40 } : undefined}>
      <div className="chead">
        <div className="avatar" style={{ background: avatarColor(comment.user) }}>
          {comment.user[0].toUpperCase()}
        </div>
        <div>
          <div className="cuser">{comment.user}</div>
          <div className="cdate">{comment.date || fmtDate(comment.createdAt)}</div>
        </div>
        <button className="flag" onClick={() => onReport(comment)}>⚑</button>
      </div>
      <div className="ctext">{comment.text}</div>
      <div className="cactions">
        <button className={comment.likedByMe ? "liked" : ""} onClick={() => onLike(comment)}>
          {comment.likedByMe ? "❤️" : "🤍"} {(comment.likes || 0).toLocaleString("it-IT")}
        </button>
        {!isReply && (
          <button onClick={() => onLoadReplies(comment)}>💬 {comment.replies || 0}</button>
        )}
        {!isReply && <button onClick={() => onReply(comment)}>Rispondi</button>}
      </div>
      {replies?.map(r => (
        <Comment key={r.id} comment={r} onLike={onLike} onReport={onReport} isReply />
      ))}
    </div>
  );
}

export default function Comments() {
  const { S } = useApp();
  const nav = useNav();
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [openReplies, setOpenReplies] = useState({}); // commentId -> [replies]
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const item = byId(nav.route.id);
  const titleId = nav.route.id;

  const refresh = async () => {
    try {
      const res = await backend.getComments(titleId, S.langs);
      setComments(res.comments);
      setTotal(res.total);
      setOffline(false);
    } catch {
      // Backend non raggiungibile: mostra i commenti seed in sola lettura
      const seed = SEED_COMMENTS[titleId] || SEED_COMMENTS.default;
      setComments(seed.map((c, i) => ({ ...c, id: `seed-${i}`, likedByMe: false })));
      setTotal(seed.length);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [titleId]);

  if (!item) return null;

  const requireOnline = fn => (...args) => {
    if (offline) return toast("Backend non raggiungibile: commenti in sola lettura");
    return fn(...args);
  };

  const onLike = requireOnline(async comment => {
    const r = await backend.likeComment(comment.id).catch(() => null);
    if (!r) return toast("Errore, riprova");
    const apply = c => (c.id === comment.id ? { ...c, likes: r.likes, likedByMe: r.liked } : c);
    setComments(cs => cs.map(apply));
    setOpenReplies(or =>
      Object.fromEntries(Object.entries(or).map(([k, list]) => [k, list.map(apply)]))
    );
  });

  const onReport = requireOnline(async comment => {
    await backend.reportComment(comment.id).catch(() => null);
    toast("Commento segnalato, grazie");
  });

  const onLoadReplies = requireOnline(async comment => {
    if (openReplies[comment.id]) {
      setOpenReplies(({ [comment.id]: _, ...rest }) => rest); // chiudi
      return;
    }
    const r = await backend.getReplies(comment.id).catch(() => null);
    if (r) setOpenReplies(or => ({ ...or, [comment.id]: r.replies }));
  });

  const submit = async text => {
    try {
      await backend.postComment(titleId, text, {
        lang: S.langs[0] || "Italiano",
        parentId: replyTo?.id,
        username: S.username,
      });
      setComposing(false);
      setReplyTo(null);
      toast(replyTo ? "Risposta pubblicata" : "Commento pubblicato");
      refresh();
    } catch {
      toast("Impossibile pubblicare: backend non raggiungibile");
    }
  };

  return (
    <>
      <TopBar title={item.title} sub={`${total} commenti`} back />
      <div className="sortline">
        <span className="lab">ORDINA PER</span>
        <span className="val">I più rilevanti</span>
        <button className="gear" onClick={() => nav.go("lingua")}>⚙</button>
      </div>
      {offline && (
        <div className="empty-note" style={{ padding: "10px 24px" }}>
          ⚠️ Server non raggiungibile: commenti dimostrativi in sola lettura.
        </div>
      )}
      {loading ? (
        <div style={{ padding: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, marginBottom: 10, borderRadius: 8 }} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="empty-note">Nessun commento. Scrivi il primo!</div>
      ) : (
        comments.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            onLike={onLike}
            onReport={onReport}
            onReply={c => { if (!offline) { setReplyTo(c); setComposing(true); } }}
            onLoadReplies={onLoadReplies}
            replies={openReplies[comment.id]}
          />
        ))
      )}
      <div style={{ height: 90 }}></div>
      <button className="fab-compose" onClick={() => { setReplyTo(null); setComposing(true); }}>✏️</button>
      {composing && (
        <ComposeSheet
          placeholder={replyTo ? `Rispondi a ${replyTo.user}…` : undefined}
          onSubmit={submit}
          onClose={() => { setComposing(false); setReplyTo(null); }}
        />
      )}
    </>
  );
}
