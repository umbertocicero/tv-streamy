// Router interno a stack: l'app ha semantica di navigazione "mobile" (push/back/reset),
// più adatta di un router a URL per un clone app-like che gira anche da file server statico.
import { createContext, useContext, useMemo, useState } from "react";

const NavContext = createContext(null);

export function NavProvider({ initial, children }) {
  const [stack, setStack] = useState([initial]);
  const route = stack[stack.length - 1];

  const api = useMemo(
    () => ({
      go: (view, params = {}) => setStack(st => [...st, { view, ...params }]),
      back: () => setStack(st => (st.length > 1 ? st.slice(0, -1) : st)),
      reset: (view, params = {}) => setStack([{ view, ...params }]),
      // aggiorna parametri della route corrente (es. cambio tab) senza push sullo stack
      setParams: patch => setStack(st => [...st.slice(0, -1), { ...st[st.length - 1], ...patch }]),
    }),
    []
  );

  return <NavContext.Provider value={{ route, ...api }}>{children}</NavContext.Provider>;
}

export const useNav = () => useContext(NavContext);
