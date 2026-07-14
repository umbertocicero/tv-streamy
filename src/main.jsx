import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppStateProvider } from "./state/AppStateContext.jsx";
import { ToastProvider } from "./state/ToastContext.jsx";
import App from "./App.jsx";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppStateProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppStateProvider>
  </StrictMode>
);
