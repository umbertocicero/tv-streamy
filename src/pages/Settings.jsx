import { useState } from "react";
import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Tabs from "../components/layout/Tabs.jsx";
import Toggle from "../components/common/Toggle.jsx";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { getSyncId, setSyncId } from "../api/backend.js";

// Sincronizzazione multi-dispositivo: mostra il codice del dispositivo e
// permette di inserirne un altro per condividere la stessa libreria.
// (Con l'autenticazione reale questo diventerà il login.)
function SyncBlock() {
  const { syncStatus } = useApp();
  const toast = useToast();
  const [code, setCode] = useState("");
  const statusLabel = {
    idle: "…", syncing: "Sincronizzazione…", online: "🟢 Connesso", offline: "🔴 Non connesso",
  }[syncStatus];

  return (
    <div className="set-block">
      <h3>Sincronizzazione <span className="save">{statusLabel}</span></h3>
      <div className="set-field">
        <div className="fl">Codice di questo dispositivo</div>
        <div className="ro" style={{ userSelect: "all", wordBreak: "break-all" }}>{getSyncId()}</div>
        <div className="set-note">
          Inserisci questo codice su un altro dispositivo per ritrovare la stessa libreria,
          gli episodi visti e le liste.
        </div>
      </div>
      <div className="set-field">
        <div className="fl">Collega a un altro dispositivo</div>
        <input
          placeholder="Incolla qui il codice dell'altro dispositivo"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
      </div>
      <button
        className="browse-btn"
        style={{ margin: "6px 0 14px" }}
        onClick={() => {
          try {
            setSyncId(code);
            toast("Dispositivo collegato, ricarico…");
            setTimeout(() => window.location.reload(), 600);
          } catch (e) {
            toast(e.message);
          }
        }}
      >
        COLLEGA
      </button>
    </div>
  );
}

function AccountTab() {
  const { S, patch, logout, deleteAccount } = useApp();
  const nav = useNav();
  const toast = useToast();
  const [username, setUsername] = useState(S.username);
  const [email, setEmail] = useState(S.email);
  const dirty = username !== S.username || email !== S.email;

  const saveIdent = () => {
    patch({ username: username.trim() || S.username, email: email.trim() || S.email });
    toast("Profilo salvato");
  };

  return (
    <>
      <div className="set-block">
        <h3>
          Identificazione
          <button className={`save ${dirty ? "dirty" : ""}`} onClick={saveIdent}>SALVA</button>
        </h3>
        <div className="set-field">
          <div className="fl">Nome utente</div>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="set-field">
          <div className="fl">Email</div>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="set-field">
          <div className="fl">ID utente</div>
          <div className="ro">{S.userId}</div>
        </div>
        <button className="set-link" onClick={() => toast("Cambio password (mock)")}>
          Cambia password <span>›</span>
        </button>
      </div>
      <SyncBlock />
      <div className="set-block">
        <h3>Social network</h3>
        <button className="set-link" onClick={() => toast("Account collegati (mock)")}>
          Modifica gli account collegati <span>›</span>
        </button>
      </div>
      <div className="set-block">
        <h3>Servizi Di Abbonamento</h3>
        <button className="set-link" onClick={() => toast("Servizi streaming (mock): alimentano “Dove guardare”")}>
          Modifica i tuoi servizi di abbonamento <span>›</span>
        </button>
      </div>
      <div className="set-block">
        <h3>Privacy</h3>
        <button className="set-link" onClick={() => toast("Privacy e note legali (mock)")}>
          Leggi Privacy e Note legali
        </button>
        <div className="set-link" style={{ cursor: "default" }}>
          <div>
            Imposta il profilo come privato
            <div className="set-note">
              Se il tuo profilo è privato, devi approvare le richieste di chi desidera seguirti. Solo i follower
              possono vedere la tua attività.
            </div>
          </div>
          <Toggle on={S.privateProfile} onChange={() => patch({ privateProfile: !S.privateProfile })} />
        </div>
      </div>
      <button className="logout" onClick={() => { logout(); nav.reset("login"); }}>
        ESCI
      </button>
      <button
        className="delete-acc"
        onClick={() => {
          if (confirm("Eliminare definitivamente l'account e tutti i dati locali?")) {
            deleteAccount();
            nav.reset("login");
          }
        }}
      >
        ELIMINA L'ACCOUNT
      </button>
    </>
  );
}

function AppTab() {
  const nav = useNav();
  const toast = useToast();
  return (
    <div className="set-block">
      <h3>Preferenze app</h3>
      <button className="set-link" onClick={() => nav.go("lingua")}>
        Lingua dei commenti <span>›</span>
      </button>
      <div className="set-link" style={{ cursor: "default" }}>
        <span>Notifiche push</span>
        <Toggle on onChange={() => toast("Notifiche (mock)")} />
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("account");
  return (
    <>
      <TopBar title="Impostazioni" back />
      <Tabs
        variant="under"
        tabs={[["account", "Account"], ["app", "App"], ["inarrivo", "In arrivo"]]}
        active={tab}
        onChange={setTab}
      />
      {tab === "account" && <AccountTab />}
      {tab === "app" && <AppTab />}
      {tab === "inarrivo" && (
        <div className="empty-note">
          🚧<br /><br />Nuove funzioni in arrivo:<br />badge stagionali, widget e altro.
        </div>
      )}
      <BottomNav active="profilo" />
    </>
  );
}
