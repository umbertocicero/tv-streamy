// variant: "top"    — sticky in cima alla pagina (nessuna topbar sopra)
//          "under"  — sticky sotto la topbar
//          "static" — scorre col contenuto
export default function Tabs({ tabs, active, onChange, variant = "static" }) {
  const className = variant === "under" ? "tabs" : "tabs no-top";
  const style = variant === "static" ? { position: "static" } : undefined;
  return (
    <div className={className} style={style}>
      {tabs.map(([key, label]) => (
        <button key={key} className={active === key ? "active" : ""} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
