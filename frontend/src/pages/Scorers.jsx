import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle, TeamBadge } from "../components/ui.jsx";

export default function Scorers() {
  const { data, loading } = usePolling(() => api.scorers(), { interval: 20000 });

  if (loading && !data) return <Loader />;
  if (!data?.length) return <EmptyState icon="🎯" title="Nenhum gol registrado ainda" />;

  const [top, ...rest] = data;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>🎯 Artilharia</SectionTitle>

      {/* Destaque do artilheiro */}
      <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-brand/10 to-transparent border-brand/30">
        <div className="text-4xl">👑</div>
        <TeamBadge team={top.team} size={56} />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-brand-400 font-bold uppercase tracking-wide">Artilheiro</div>
          <div className="text-xl font-black truncate">{top.name}</div>
          <Link to={`/times/${top.team.id}`} className="text-sm text-gray-400 hover:text-brand-400">{top.team.name}</Link>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-brand-400">{top.goals}</div>
          <div className="text-xs text-gray-500">gols</div>
        </div>
      </div>

      {/* Ranking */}
      <div className="card divide-y divide-white/5">
        {rest.map((s) => (
          <div key={s.playerId} className="flex items-center gap-3 p-3">
            <span className="w-6 text-center font-black text-gray-500">{s.rank}</span>
            <TeamBadge team={s.team} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{s.name}</div>
              <Link to={`/times/${s.team.id}`} className="text-xs text-gray-500 hover:text-brand-400">{s.team.shortName}</Link>
            </div>
            {s.penalties > 0 && <span className="text-xs text-gray-500">{s.penalties} pên.</span>}
            <div className="text-right w-14">
              <span className="text-xl font-black text-brand-400">{s.goals}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
