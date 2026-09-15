import { useParams, Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api, resolveCrestUrl } from "../api/client.js";
import { Loader, EmptyState, TeamBadge } from "../components/ui.jsx";
import MatchCard from "../components/MatchCard.jsx";

export default function TeamDetail() {
  const { id } = useParams();
  const { data: team, loading } = usePolling(() => api.team(id), { deps: [id] });

  if (loading && !team) return <Loader />;
  if (!team) return <EmptyState title="Time não encontrado" />;

  const st = team.stats;
  const played = team.matches.filter((m) => m.status !== "SCHEDULED");
  const upcoming = team.matches.filter((m) => m.status === "SCHEDULED");

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/times" className="text-sm text-gray-400 hover:text-brand-400">← Voltar aos times</Link>

      {/* Cabeçalho */}
      <div className="card p-6 flex items-center gap-4" style={{ borderColor: `${team.color}40` }}>
        <TeamBadge team={team} size={72} />
        <div>
          <h1 className="text-2xl font-black">{team.name}</h1>
          <p className="text-sm text-gray-400">
            {team.city && `📍 ${team.city}`} {team.founded && `· Fundado em ${team.founded}`}
          </p>
          <p className="text-sm text-brand-400 font-semibold mt-1">
            Grupo {team.group}{st ? ` · ${st.position}º lugar · ${st.points} pts` : ""}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {st && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatBox label="Jogos" value={st.played} />
          <StatBox label="Vitórias" value={st.wins} accent />
          <StatBox label="Empates" value={st.draws} />
          <StatBox label="Derrotas" value={st.losses} />
          <StatBox label="Gols Pró" value={st.goalsFor} />
          <StatBox label="Saldo" value={st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff} />
        </div>
      )}

      {/* Elenco */}
      <section>
        <h2 className="text-lg font-extrabold mb-3">👥 Elenco</h2>
        {team.players?.length ? (
          <div className="card divide-y divide-white/5">
            {team.players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                {p.photo ? (
                  <img src={resolveCrestUrl(p.photo)} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center font-black text-sm text-gray-400 shrink-0">
                    {p.number ?? "–"}
                  </span>
                )}
                <span className="flex-1 font-semibold">{p.name}</span>
                <span className="text-xs text-gray-500">{p.position || "—"}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState icon="👥" title="Elenco não cadastrado" />}
      </section>

      {/* Jogos */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold mb-3">📅 Próximos jogos</h2>
          <div className="grid gap-3 sm:grid-cols-2">{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        </section>
      )}
      {played.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold mb-3">🏁 Jogos disputados</h2>
          <div className="grid gap-3 sm:grid-cols-2">{played.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        </section>
      )}
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
