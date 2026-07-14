import { useState, useEffect } from "react";
import TopBar from "../components/layout/TopBar.jsx";
import BottomNav from "../components/layout/BottomNav.jsx";
import Poster from "../components/common/Poster.jsx";
import { useNav } from "../state/NavContext.jsx";
import { useCatalog } from "../hooks/useCatalog.js";

export default function Browse() {
  const { route } = useNav();
  const kind = route.kind || "serie";
  const { titles, loading } = useCatalog();

  // Filtra per tipo
  const items = titles.filter(x => x.type === kind);

  return (
    <>
      <TopBar title={kind === "serie" ? "Tutte le serie" : "Tutti i film"} back />
      <div className="grid" style={{ marginTop: 12 }}>
        {loading ? (
          // Skeleton loading
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                aspectRatio: "2/3",
                borderRadius: "var(--radius-md)",
              }}
            />
          ))
        ) : items.length > 0 ? (
          items.map(item => (
            <Poster key={item.id} item={item} withAdd />
          ))
        ) : (
          <div style={{ gridColumn: "1/-1", padding: "40px 20px", textAlign: "center", color: "#999" }}>
            Nessun titolo disponibile
          </div>
        )}
      </div>
      <BottomNav active={kind} />
    </>
  );
}
