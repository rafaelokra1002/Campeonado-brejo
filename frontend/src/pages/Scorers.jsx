import { useState } from "react";
import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle, TeamBadge } from "../components/ui.jsx";
import { teamFirstName } from "../lib/format.js";

export default function Scorers() {
  const [tab, setTab] = useState("goals"); // goals | cards

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle
        action={
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setTab("goals")}
              className={`chip text-xs ${tab === "goals" ? "bg-brand text-night-950" : "text-gray-400"}`}
            >
              🎯 Gols
            </button>
            <button
              onClick={() => setTab("cards")}
              className={`chip text-xs ${tab === "cards" ? "bg-brand text-night-950" : "text-gray-400"}`}
            >
              🟨 Cartões
            </button>
          </div>
        }
      >
        {tab === "goals" ? "🎯 Artilharia" : "🟨 Cartões"}
      </SectionTitle>

      {tab === "goals" ? <GoalsRanking /> : <CardsRanking />}
    </div>
  );
}

function GoalsRanking() {
  const { data, loading } = usePolling(() => api.scorers(), { interval: 20000 });

  if (loading && !data) return <Loader />;
  if (!data?.length) return <EmptyState icon="🎯" title="Nenhum gol registrado ainda" />;

  const [top, ...rest] = data;

  return (
    <>
      {/* Destaque do artilheiro */}
      <Link to={`/jogadores/${top.playerId}`} className="card p-6 flex items-center gap-4 bg-gradient-to-r from-brand/10 to-transparent border-brand/30">
        <div className="text-4xl">👑</div>
        <TeamBadge team={top.team} size={56} />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-brand-400 font-bold uppercase tracking-wide">Artilheiro</div>
          <div className="text-xl font-black truncate">{top.name}</div>
          <span className="text-sm text-gray-400">{top.team.name}</span>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-brand-400">{top.goals}</div>
          <div className="text-xs text-gray-500">gols</div>
        </div>
      </Link>

      {/* Ranking */}
      <div className="card divide-y divide-white/5">
        {rest.map((s) => (
          <Link key={s.playerId} to={`/jogadores/${s.playerId}`} className="flex items-center gap-3 p-3 hover:bg-white/5 transition">
            <span className="w-6 text-center font-black text-gray-500">{s.rank}</span>
            <TeamBadge team={s.team} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{s.name}</div>
              <span className="text-xs text-gray-500">{teamFirstName(s.team.name)}</span>
            </div>
            {s.penalties > 0 && <span className="text-xs text-gray-500">{s.penalties} pên.</span>}
            <div className="text-right w-14">
              <span className="text-xl font-black text-brand-400">{s.goals}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function CardsRanking() {
  const { data, loading } = usePolling(() => api.cardsRanking(), { interval: 20000 });

  if (loading && !data) return <Loader />;
  if (!data?.length) return <EmptyState icon="🟨" title="Nenhum cartão registrado ainda" />;

  return (
    <div className="card divide-y divide-white/5">
      {data.map((s) => (
        <Link key={s.playerId} to={`/jogadores/${s.playerId}`} className="flex items-center gap-3 p-3 hover:bg-white/5 transition">
          <span className="w-6 text-center font-black text-gray-500">{s.rank}</span>
          <TeamBadge team={s.team} size={36} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{s.name}</div>
            <span className="text-xs text-gray-500">{teamFirstName(s.team.name)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            {s.yellow > 0 && <span className="flex items-center gap-1">🟨 {s.yellow}</span>}
            {s.red > 0 && <span className="flex items-center gap-1">🟥 {s.red}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
