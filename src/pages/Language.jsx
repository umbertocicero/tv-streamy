import TopBar from "../components/layout/TopBar.jsx";
import { LANGUAGES } from "../data/constants.js";
import { useApp } from "../state/AppStateContext.jsx";

export default function Language() {
  const { S, toggleLang } = useApp();
  return (
    <>
      <TopBar title="Lingua dei commenti" back />
      <div className="lang-head">Mostra i commenti nelle lingue seguenti:</div>
      {LANGUAGES.map(lang => {
        const on = S.langs.includes(lang);
        return (
          <label className="lang-row" key={lang} onClick={() => toggleLang(lang)}>
            <span className={`cbx ${on ? "on" : ""}`}>{on ? "✓" : ""}</span> {lang}
          </label>
        );
      })}
      <div style={{ height: 80 }}></div>
    </>
  );
}
