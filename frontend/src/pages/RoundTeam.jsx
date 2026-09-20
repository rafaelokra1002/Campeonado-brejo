import { useState } from "react";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle } from "../components/ui.jsx";
import RoundTeamPitch from "../components/RoundTeamPitch.jsx";
import FanVote from "../components/FanVote.jsx";
import { matchStageLabel } from "../lib/format.js";

export default function RoundTeam() {
  const { data, loading, refetch } = usePolling(() => api.roundTeams(), { interval: 30000 });
  const [selectedId, setSelectedId] = useState(null);

  if (loading && !data) return <Loader />;
  if (!data?.length) {
    return <EmptyState icon="⭐" title="Seleção da rodada ainda não divulgada" subtitle="Assim que o admin montar, ela aparece aqui." />;
  }

  const current = data.find((rt) => rt.id === selectedId) || data[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>⭐ Seleção da rodada</SectionTitle>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedId(rt.id)}
            className={`chip whitespace-nowrap ${current.id === rt.id ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            {matchStageLabel(rt)}
          </button>
        ))}
      </div>

      <RoundTeamPitch picks={current.picks} />

      <FanVote key={current.id} roundTeam={current} onVoted={() => refetch(true)} />
    </div>
  );
}
