// Commenti seed per popolare le discussioni dei titoli.
export const SEED_COMMENTS = {
  vfi: [
    { user: "Martina 🎀", date: "dom 21 giu 2026", text: "and then he left a voicemail for Isabelle too", img: "🐈", likes: 3657, replies: 10 },
    { user: "Mai", date: "gio 25 giu 2026", text: "HER😭SISTER😭DANCING😭BEHIND😭HER", img: "💃", likes: 2101, replies: 4 },
    { user: "Luca", date: "ven 26 giu 2026", text: "Zoey Deutch carries this movie on her back, che interpretazione!", likes: 890, replies: 2 },
    { user: "Aria", date: "sab 27 giu 2026", text: "Non ero pronta al finale. NON ERO PRONTA.", likes: 512, replies: 7 },
  ],
  default: [
    { user: "Giorgio", date: "lun 6 lug 2026", text: "Capolavoro assoluto, rivisto per la terza volta.", likes: 214, replies: 3 },
    { user: "Sofia", date: "mar 7 lug 2026", text: "L'episodio 3 mi ha distrutto emotivamente 😭", likes: 156, replies: 1 },
    { user: "Anna", date: "mer 8 lug 2026", text: "Qualcuno ha notato il dettaglio nella scena finale?", likes: 89, replies: 5 },
  ],
};

export function commentsFor(id, mine) {
  return [...(SEED_COMMENTS[id] || SEED_COMMENTS.default), ...(mine[id] || [])];
}
