import { useParams, Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api, resolveCrestUrl } from "../api/client.js";
import { Loader, EmptyState, TeamBadge } from "../components/ui.jsx";

export default function PlayerDetail() {
  const { id } = useParams();
  const { data: player, loading } = usePolling(() => api.player(id), { deps: [id] });

  if (loading && !player) return <Loader />;
  if (!player) return <EmptyState title="Jogador não encontrado" />;

  const st = player.stats;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to={`/times/${player.team.id}`} className="text-sm text-gray-400 hover:text-brand-400">← Voltar ao time</Link>

      {/* Cabeçalho */}
      <div className="card p-6 flex items-center gap-4">
        {player.photo ? (
          <img src={resolveCrestUrl(player.photo)} alt={player.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center font-black text-2xl text-gray-400 shrink-0">
            {player.number ?? "–"}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-black">{player.name}</h1>
          <p className="text-sm text-gray-400">{player.position || "Posição não informada"}{player.number != null && ` · Nº ${player.number}`}</p>
          <Link to={`/times/${player.team.id}`} className="flex items-center gap-2 mt-1.5 hover:text-brand-400 transition">
            <TeamBadge team={player.team} size={22} />
            <span className="text-sm font-semibold">{player.team.name}</span>
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <StatBox label="Gols" value={st.goals} accent />
        <StatBox label="Pênaltis" value={st.penalties} />
        <StatBox label="Amarelos" value={st.yellow} />
        <StatBox label="Vermelhos" value={st.red} />
        <StatBox label="Gols contra" value={st.ownGoals} />
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className="card p-3 text-center">
      <div className={`text-2xl font-black tabular-nums ${accent ? "text-brand-400" : ""}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
