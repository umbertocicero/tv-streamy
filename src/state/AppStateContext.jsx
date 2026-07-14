// Store applicativo: unica fonte di verità per lo stato utente, persistito in localStorage.
// Le azioni sono aggiornamenti immutabili; i componenti leggono via useApp().
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { byId } from "../data/catalog.js";
import { epKey, watchMinutes } from "../utils/library.js";
import { todayLabel } from "../utils/format.js";

const STORAGE_KEY = "tvstreamy";

export const DEFAULT_STATE = {
  loggedIn: false,
  username: "110411111",
  email: "umbertocicero@gmail.com",
  userId: "110411111",
  privateProfile: false,
  emailOptIn: false,
  added: [],            // id titoli in libreria
  watched: {},          // filmId -> true, oppure "serieId|s|e" -> true
  favorites: [],
  ratings: {},          // id -> 1..5
  reactions: {},        // id -> indice emoji
  wheres: {},           // id -> theater | altro | non-ufficiale
  polls: {},            // id -> opzione sondaggio
  lists: [{ name: "lista mia", items: ["endgame"], private: true }],
  myComments: {},       // id -> [{user,date,text,likes,replies}]
  likedComments: {},    // "titleId:idx" -> true
  langs: ["Italiano", "Inglese"],
  watchLog: [],         // {id, minutes, ts, type} per le statistiche
};

function load() {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [S, setS] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  }, [S]);

  const actions = useMemo(() => {
    const set = fn => setS(prev => fn(prev));
    const toggleInArray = (key, id) =>
      set(s => ({
        ...s,
        [key]: s[key].includes(id) ? s[key].filter(x => x !== id) : [...s[key], id],
      }));

    return {
      login: () =>
        set(s => ({ ...s, loggedIn: true, added: s.added.length ? s.added : ["hotd"] })),
      logout: () => set(s => ({ ...s, loggedIn: false })),
      deleteAccount: () => {
        localStorage.removeItem(STORAGE_KEY);
        setS({ ...DEFAULT_STATE });
      },
      patch: p => set(s => ({ ...s, ...p })),

      toggleAdd: id => toggleInArray("added", id),
      toggleFav: id => toggleInArray("favorites", id),
      removeTitle: id => set(s => ({ ...s, added: s.added.filter(x => x !== id) })),

      toggleEpisode: (id, se, ep) =>
        set(s => {
          const k = epKey(id, se, ep);
          const watched = { ...s.watched };
          let watchLog = s.watchLog;
          if (watched[k]) delete watched[k];
          else {
            watched[k] = true;
            watchLog = [...watchLog, { id, minutes: 45, ts: Date.now(), type: "serie" }];
          }
          return { ...s, watched, watchLog };
        }),

      toggleWatched: id =>
        set(s => {
          const item = byId(id);
          const watched = { ...s.watched };
          let watchLog = s.watchLog, added = s.added;
          if (watched[id]) delete watched[id];
          else {
            watched[id] = true;
            if (item.type === "film")
              watchLog = [...watchLog, { id, minutes: watchMinutes(item), ts: Date.now(), type: "film" }];
            if (!added.includes(id)) added = [...added, id];
          }
          return { ...s, watched, watchLog, added };
        }),

      rateTitle: (id, n) => set(s => ({ ...s, ratings: { ...s.ratings, [id]: n } })),
      setReaction: (id, i) => set(s => ({ ...s, reactions: { ...s.reactions, [id]: i } })),
      setWhere: (id, w) => set(s => ({ ...s, wheres: { ...s.wheres, [id]: w } })),
      setPoll: (id, o) => set(s => ({ ...s, polls: { ...s.polls, [id]: o } })),

      addComment: (id, text) =>
        set(s => ({
          ...s,
          myComments: {
            ...s.myComments,
            [id]: [...(s.myComments[id] || []), { user: s.username, date: todayLabel(), text, likes: 0, replies: 0 }],
          },
        })),
      toggleLikeComment: (id, i) =>
        set(s => {
          const k = `${id}:${i}`;
          const likedComments = { ...s.likedComments };
          likedComments[k] ? delete likedComments[k] : (likedComments[k] = true);
          return { ...s, likedComments };
        }),

      createList: name => set(s => ({ ...s, lists: [...s.lists, { name, items: [], private: true }] })),
      deleteList: i => set(s => ({ ...s, lists: s.lists.filter((_, j) => j !== i) })),
      toggleListPrivacy: i =>
        set(s => ({
          ...s,
          lists: s.lists.map((l, j) => (j === i ? { ...l, private: !l.private } : l)),
        })),
      addToList: (i, id) =>
        set(s => ({
          ...s,
          lists: s.lists.map((l, j) =>
            j === i && !l.items.includes(id) ? { ...l, items: [...l.items, id] } : l
          ),
        })),

      toggleLang: l =>
        set(s => ({
          ...s,
          langs: s.langs.includes(l) ? s.langs.filter(x => x !== l) : [...s.langs, l],
        })),
    };
  }, []);

  const value = useMemo(() => ({ S, ...actions }), [S, actions]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export const useApp = () => useContext(AppStateContext);
