// Grafico a barre minimale in puro CSS: sufficiente per le statistiche, zero dipendenze.
export default function BarChart({ values, labels }) {
  const max = Math.max(...values, 1);
  return (
    <>
      <div className="barchart">
        {values.map((v, i) => (
          <div className="bar" key={i}>
            <span className="v">{v}</span>
            <div className="b" style={{ height: `${Math.round((v / max) * 85)}%` }}></div>
          </div>
        ))}
      </div>
      <div className="barchart-x">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </>
  );
}
