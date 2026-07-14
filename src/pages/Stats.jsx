import { useState } from "react";
import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Tabs from "../components/layout/Tabs.jsx";
import BarChart from "../components/common/BarChart.jsx";
import { MEDALS } from "../data/constants.js";
import { useApp } from "../state/AppStateContext.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { statTotals, last7, dailySeries, backlogEpisodes } from "../utils/library.js";

const MONTH_INITIALS = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];

function StatCard({ title, children }) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export default function Stats() {
  const { S } = useApp();
  const toast = useToast();
  const [kind, setKind] = useState("serie");

  const t = statTotals(S);
  const tt = kind === "serie" ? t.serie : t.film;
  const [hours, dayLabels] = dailySeries(S, kind, 12, "hours");
  const [counts] = dailySeries(S, kind, 12, "count");

  const recentEps = S.watchLog.filter(l => l.type === "serie" && Date.now() - l.ts < 60 * 86400000).length;
  const pace = (recentEps / 8.6).toFixed(2);
  const backlog = backlogEpisodes(S);
  const backlogHours = Math.round((backlog * 45) / 60);
  const catchupDate =
    recentEps > 0 && backlog > 0
      ? new Date(Date.now() + (backlog / (recentEps / 60)) * 86400000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  const medalsWon = Object.values(S.myComments).reduce((a, c) => a + c.length, 0) > 0 ? 1 : 0;
  const futureLabels = Array.from({ length: 6 }, (_, i) => MONTH_INITIALS[(new Date().getMonth() + i) % 12]);
  const noun = kind === "serie" ? "episodi" : "film";

  return (
    <>
      <TopBar title="Statistiche" back />
      <Tabs variant="under" tabs={[["serie", "Serie"], ["film", "Film"]]} active={kind} onChange={setKind} />
      <StatCard title={`Tempo trascorso a guardare ${noun}`}>
        <div className="bignum">
          {tt.mesi} <small>mesi</small> {tt.giorni} <small>giorni</small> {tt.ore} <small>ore</small>
        </div>
        <div className="subnote">{Math.round(last7(S, kind, "minutes") / 60)} ore negli ultimi 7 giorni</div>
        <button className="compare" onClick={() => toast("Confronto disponibile quando segui qualcuno")}>
          CONFRONTA CON LE PERSONE CHE SEGUI
        </button>
      </StatCard>
      <StatCard title={`Tempo trascorso a guardare ${noun}`}>
        <BarChart values={hours} labels={dayLabels} />
        <div className="axis-note">Alla settimana</div>
      </StatCard>
      <StatCard title={`Totale ${noun} visti`}>
        <div className="bignum">{kind === "serie" ? t.eps : t.films}</div>
        <div className="subnote">{last7(S, kind, "count")} negli ultimi 7 giorni</div>
      </StatCard>
      <StatCard title={`${kind === "serie" ? "Episodi" : "Film"} visti`}>
        <BarChart values={counts} labels={dayLabels} />
      </StatCard>
      {kind === "serie" && (
        <>
          <StatCard title="Quanto velocemente ti stai mettendo in pari?">
            <div className="bignum">{pace} <small>episodi/settimana</small></div>
            <div className="subnote">In base agli episodi che hai visto negli ultimi due mesi</div>
          </StatCard>
          <StatCard title="Tempo da guardare">
            <div className="bignum">{backlogHours} <small>ore</small></div>
          </StatCard>
          <StatCard title="Tempo di visione futuro">
            <BarChart values={[backlogHours, 0, 0, 0, 0, 0]} labels={futureLabels} />
            <div className="axis-note">Ore</div>
          </StatCard>
          <StatCard title="Quando ti metterai in pari con i tuoi episodi">
            <div className="bignum">{catchupDate}</div>
            <div className="subnote">In base agli episodi che hai visto negli ultimi due mesi</div>
          </StatCard>
        </>
      )}
      <StatCard title="Medaglie dell'app">
        <div className="bignum">{medalsWon}</div>
        <div className="medals">
          {MEDALS.map(([emoji, name], i) => (
            <div className={`medal ${i === 0 && medalsWon ? "won" : ""}`} key={name}>
              {emoji}
              <span className="mname">{name}</span>
            </div>
          ))}
        </div>
      </StatCard>
      <BottomNav active="profilo" />
    </>
  );
}
