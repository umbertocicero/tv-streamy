import { CATALOG } from "../data/catalog.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { posterGradient } from "../utils/format.js";

const PROVIDERS = [
  ["Apple", "s-apple", ""],
  ["Facebook", "s-fb", "f"],
  ["Google", "s-google", "G"],
  ["X", "s-x", "𝕏"],
  ["Email", "s-mail", "✉️"],
];

export default function Login() {
  const { S, login, patch } = useApp();
  const nav = useNav();
  const toast = useToast();

  const doLogin = provider => {
    login();
    toast(`Accesso con ${provider} effettuato`);
    nav.reset("serie");
  };

  const mosaic = [...CATALOG, ...CATALOG].map((item, i) => (
    <div className="poster" key={i} style={{ background: posterGradient(item.title) }}>
      <span>{item.title}</span>
    </div>
  ));

  return (
    <div className="login">
      <div className="mosaic">{mosaic}</div>
      <div className="overlay">
        <div className="logo">
          <span className="t">T</span> TV STREAMY
        </div>
        <div className="tagline">📅 Ricorda il punto in cui avevi interrotto la visione</div>
        <div className="panel">
          <h2>Continua con</h2>
          <div className="socials">
            {PROVIDERS.map(([name, cls, glyph]) => (
              <button key={name} className={cls} onClick={() => doLogin(name)} title={name}>
                {glyph}
              </button>
            ))}
          </div>
          <label className="optin">
            <span
              className={`cbx ${S.emailOptIn ? "on" : ""}`}
              onClick={() => patch({ emailOptIn: !S.emailOptIn })}
            >
              {S.emailOptIn ? "✓" : ""}
            </span>
            Voglio ricevere aggiornamenti via email sulle mie serie e sui miei film
          </label>
          <div className="terms">
            Continuando accetti le <a href="#" onClick={e => e.preventDefault()}>condizioni d'uso</a> e le{" "}
            <a href="#" onClick={e => e.preventDefault()}>norme sulla privacy</a> di TV Streamy
          </div>
        </div>
      </div>
    </div>
  );
}
