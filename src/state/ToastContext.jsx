// Notifiche effimere non bloccanti, con un solo toast visibile alla volta.
import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback(text => {
    clearTimeout(timer.current);
    setMsg(text);
    timer.current = setTimeout(() => setMsg(null), 1800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
