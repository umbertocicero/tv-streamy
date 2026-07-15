// Commenti persistenti e condivisi tra tutti gli utenti:
// thread per titolo, risposte annidate a un livello, like e segnalazioni.
import { Router } from "express";
import { db } from "../db.js";

export const commentsRouter = Router();

const MAX_TEXT = 2000;

const listComments = db.prepare(`
  SELECT c.id, c.title_id, c.user_id, c.username, c.text, c.lang, c.parent_id, c.created_at,
         COUNT(DISTINCT l.user_id) AS likes,
         (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) AS replies,
         EXISTS(SELECT 1 FROM comment_likes ml WHERE ml.comment_id = c.id AND ml.user_id = @me) AS liked_by_me
  FROM comments c
  LEFT JOIN comment_likes l ON l.comment_id = c.id
  WHERE c.title_id = @titleId AND c.parent_id IS NULL
  GROUP BY c.id
  ORDER BY likes DESC, c.created_at DESC
  LIMIT @limit OFFSET @offset
`);

const listReplies = db.prepare(`
  SELECT c.id, c.user_id, c.username, c.text, c.lang, c.created_at,
         COUNT(DISTINCT l.user_id) AS likes,
         EXISTS(SELECT 1 FROM comment_likes ml WHERE ml.comment_id = c.id AND ml.user_id = @me) AS liked_by_me
  FROM comments c
  LEFT JOIN comment_likes l ON l.comment_id = c.id
  WHERE c.parent_id = @parentId
  GROUP BY c.id
  ORDER BY c.created_at ASC
`);

const countForTitle = db.prepare("SELECT COUNT(*) AS n FROM comments WHERE title_id = ?");
const getComment = db.prepare("SELECT * FROM comments WHERE id = ?");
const insertComment = db.prepare(`
  INSERT INTO comments (title_id, user_id, username, text, lang, parent_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function shape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.username,
    text: row.text,
    lang: row.lang,
    likes: row.likes,
    replies: row.replies ?? 0,
    likedByMe: !!row.liked_by_me,
    createdAt: row.created_at,
  };
}

// GET /api/titles/:titleId/comments?langs=Italiano,Inglese&limit=50&offset=0
commentsRouter.get("/titles/:titleId/comments", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;
  const langs = (req.query.langs || "").split(",").filter(Boolean);

  let rows = listComments.all({ titleId: req.params.titleId, me: req.userId, limit, offset });
  if (langs.length) rows = rows.filter(r => langs.includes(r.lang));

  res.json({
    total: countForTitle.get(req.params.titleId).n,
    comments: rows.map(shape),
  });
});

// GET /api/comments/:id/replies
commentsRouter.get("/comments/:id/replies", (req, res) => {
  const rows = listReplies.all({ parentId: req.params.id, me: req.userId });
  res.json({ replies: rows.map(shape) });
});

// POST /api/titles/:titleId/comments { text, lang?, parentId? }
commentsRouter.post("/titles/:titleId/comments", (req, res) => {
  const { text, lang, parentId } = req.body || {};
  const trimmed = (text || "").trim();
  if (!trimmed) return res.status(400).json({ error: "empty_text" });
  if (trimmed.length > MAX_TEXT) return res.status(400).json({ error: "text_too_long", max: MAX_TEXT });

  if (parentId) {
    const parent = getComment.get(parentId);
    if (!parent || parent.title_id !== req.params.titleId) {
      return res.status(400).json({ error: "invalid_parent" });
    }
    if (parent.parent_id) return res.status(400).json({ error: "max_depth" }); // un solo livello di risposte
  }

  const now = Date.now();
  const info = insertComment.run(
    req.params.titleId, req.userId, req.username, trimmed,
    lang || "Italiano", parentId || null, now
  );
  res.status(201).json({
    comment: {
      id: info.lastInsertRowid, userId: req.userId, user: req.username,
      text: trimmed, lang: lang || "Italiano", likes: 0, replies: 0,
      likedByMe: false, createdAt: now,
    },
  });
});

// POST /api/comments/:id/like → toggle; risponde con il conteggio aggiornato
commentsRouter.post("/comments/:id/like", (req, res) => {
  if (!getComment.get(req.params.id)) return res.status(404).json({ error: "not_found" });

  const del = db.prepare("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  let liked = false;
  if (del.changes === 0) {
    db.prepare("INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)")
      .run(req.params.id, req.userId);
    liked = true;
  }
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM comment_likes WHERE comment_id = ?").get(req.params.id);
  res.json({ liked, likes: n });
});

// POST /api/comments/:id/report { reason? }
commentsRouter.post("/comments/:id/report", (req, res) => {
  if (!getComment.get(req.params.id)) return res.status(404).json({ error: "not_found" });
  db.prepare(`
    INSERT INTO comment_reports (comment_id, user_id, reason) VALUES (?, ?, ?)
    ON CONFLICT(comment_id, user_id) DO UPDATE SET reason = excluded.reason
  `).run(req.params.id, req.userId, (req.body?.reason || "").slice(0, 500));
  res.json({ ok: true });
});

// DELETE /api/comments/:id → solo i propri commenti
commentsRouter.delete("/comments/:id", (req, res) => {
  const comment = getComment.get(req.params.id);
  if (!comment) return res.status(404).json({ error: "not_found" });
  if (comment.user_id !== req.userId) return res.status(403).json({ error: "not_owner" });
  db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
