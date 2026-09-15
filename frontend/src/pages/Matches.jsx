import { useEffect, useState } from "react";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle } from "../components/ui.jsx";
import MatchCard from "../components/MatchCard.jsx";
import AdBanner from "../components/AdBanner.jsx";

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "LIVE", label: "🔴 Ao vivo" },
  { key: "SCHEDULED", label: "Agendados" },
  { key: "FINISHED", label: "Encerrados" },
];

export default function Matches() {
  const [rounds, setRounds] = useState([]);
  const [round, setRound] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.rounds().then((r) => setRounds(r)).catch(() => {});
  }, []);

  const { data, loading } = usePolling(
    () => api.matches({ ...(round && { round }), ...(status && { status }) }),
    { interval: 12000, deps: [round, status] }
  );

  // Agrupa por rodada
  const grouped = (data || []).reduce((acc, m) => {
    (acc[m.round] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>⚽ Jogos & Partidas</SectionTitle>

      <AdBanner slot="jogos-topo" />

      {/* Filtros de status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`chip ${status === f.key ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro de rodada */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setRound("")}
          className={`chip ${round === "" ? "bg-accent text-night-950" : "bg-white/5 text-gray-300"}`}
        >
          Todas rodadas
        </button>
        {rounds.map((r) => (
          <button
            key={r}
            onClick={() => setRound(String(r))}
            className={`chip ${round === String(r) ? "bg-accent text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            Rodada {r}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Loader />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon="⚽" title="Nenhum jogo encontrado" subtitle="Ajuste os filtros acima." />
      ) : (
        Object.entries(grouped).map(([r, matches]) => (
          <div key={r} className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide pt-2">Rodada {r}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
