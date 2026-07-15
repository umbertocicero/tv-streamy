// Store applicativo: unica fonte di verità per lo stato utente.
// Persistito in localStorage (offline-first) e sincronizzato col backend:
// pull all'avvio, push con debounce a ogni modifica. In caso di conflitto
// di versione (scrittura da un altro dispositivo) vince lo stato remoto.
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { byId } from "../data/catalog.js";
import { backend } from "../api/backend.js";
import { epKey, watchMinutes } from "../utils/library.js";
import { todayLabel } from "../utils/format.js";

const STORAGE_KEY = "tvstreamy";
const SYNC_DEBOUNCE_MS = 1200;

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
  const [syncStatus, _setSyncStatus] = useState("idle"); // idle | syncing | online | offline
  const versionRef = useRef(null);   // versione remota su cui si basa lo stato locale
  const hydratedRef = useRef(false); // evita il push prima del pull iniziale
  const offlineRef = useRef(false);
  const setSyncStatus = st => { offlineRef.current = st === "offline"; _setSyncStatus(st); };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  }, [S]);

  // Pull iniziale: se il server ha uno stato per questo sync ID, sostituisce il locale.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await backend.getState();
        if (cancelled) return;
        if (remote) {
          versionRef.current = remote.version;
          setS(prev => ({ ...DEFAULT_STATE, ...remote.data }));
        }
        setSyncStatus("online");
      } catch {
        if (!cancelled) setSyncStatus("offline"); // backend assente: l'app resta locale
      } finally {
        hydratedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Push con debounce a ogni modifica dello stato.
  useEffect(() => {
    if (!hydratedRef.current || offlineRef.current) return;
    const timer = setTimeout(async () => {
      try {
        const r = await backend.putState(S, versionRef.current, S.username);
        versionRef.current = r.version;
        setSyncStatus("online");
      } catch (e) {
        if (e.status === 409 && e.payload?.remote) {
          // Un altro dispositivo ha scritto: adotta lo stato remoto.
          versionRef.current = e.payload.remote.version;
          setS({ ...DEFAULT_STATE, ...e.payload.remote.data });
          setSyncStatus("online");
        } else {
          setSyncStatus("offline");
        }
      }
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
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
        backend.deleteAccount().catch(() => {}); // best effort: rimuove anche i dati remoti
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

  const value = useMemo(() => ({ S, syncStatus, ...actions }), [S, syncStatus, actions]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export const useApp = () => useContext(AppStateContext);
