import { useParams, Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, TeamBadge, StatusBadge } from "../components/ui.jsx";
import { formatDateTime, shareWhatsApp } from "../lib/format.js";

export default function MatchDetail() {
  const { id } = useParams();
  const { data: match, loading } = usePolling(() => api.match(id), { interval: 10000, deps: [id] });

  if (loading && !match) return <Loader />;
  if (!match) return <EmptyState title="Partida não encontrada" />;

  const showScore = match.status !== "SCHEDULED";
  const events = buildTimeline(match);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/jogos" className="text-sm text-gray-400 hover:text-brand-400">← Voltar aos jogos</Link>

      {/* Placar principal */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-center gap-3 mb-6 text-xs text-gray-400">
          <span className="font-semibold">Rodada {match.round}</span>
          <span>·</span>
          <StatusBadge status={match.status} minute={match.minute} />
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          <TeamCol team={match.homeTeam} />
          <div className="text-center">
            {showScore ? (
              <div className="text-5xl sm:text-6xl font-black tabular-nums">
                {match.homeScore}<span className="text-gray-600 mx-2">×</span>{match.awayScore}
              </div>
            ) : (
              <div className="text-4xl text-gray-600 font-black">×</div>
            )}
          </div>
          <TeamCol team={match.awayTeam} />
        </div>

        <div className="text-center mt-6 space-y-1 text-sm text-gray-400">
          <div>🕒 {formatDateTime(match.kickoff)}</div>
          {match.venue && <div>📍 {match.venue}</div>}
        </div>

        {showScore && (
          <div className="flex justify-center mt-5">
            <button onClick={() => shareWhatsApp(match)} className="btn-primary text-sm">
              📱 Compartilhar no WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Linha do tempo */}
      {events.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">📋 Lances da partida</h3>
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 ${ev.side === "away" ? "flex-row-reverse text-right" : ""}`}>
                <span className="badge bg-white/5 text-gray-400 tabular-nums w-11 justify-center">{ev.minute ? `${ev.minute}'` : "—"}</span>
                <span className="text-lg">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{ev.text}</span>
                  <span className="text-xs text-gray-500 ml-2">{ev.teamShort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && showScore && (
        <div className="card p-5 text-center text-sm text-gray-500">Nenhum lance detalhado registrado.</div>
      )}
    </div>
  );
}

function TeamCol({ team }) {
  return (
    <Link to={`/times/${team.id}`} className="flex flex-col items-center gap-2 group">
      <TeamBadge team={team} size={64} />
      <span className="font-bold text-sm text-center group-hover:text-brand-400 transition">{team.shortName}</span>
    </Link>
  );
}

// Junta gols e cartões numa timeline ordenada por minuto.
function buildTimeline(match) {
  const events = [];
  for (const g of match.goals || []) {
    const side = g.teamId === match.homeTeam.id ? "home" : "away";
    events.push({
      minute: g.minute,
      side,
      icon: g.ownGoal ? "🥅" : "⚽",
      text: `${g.player?.name || "Gol"}${g.penalty ? " (pên.)" : ""}${g.ownGoal ? " (contra)" : ""}`,
      teamShort: side === "home" ? match.homeTeam.shortName : match.awayTeam.shortName,
    });
  }
  for (const c of match.cards || []) {
    const side = c.teamId === match.homeTeam.id ? "home" : "away";
    events.push({
      minute: c.minute,
      side,
      icon: c.type === "RED" ? "🟥" : "🟨",
      text: c.player?.name || (c.type === "RED" ? "Cartão vermelho" : "Cartão amarelo"),
      teamShort: side === "home" ? match.homeTeam.shortName : match.awayTeam.shortName,
    });
  }
  return events.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
}
