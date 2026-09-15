import { Link } from "react-router-dom";
import { TeamBadge, StatusBadge } from "./ui.jsx";
import { formatDateTime, shareWhatsApp } from "../lib/format.js";

export default function MatchCard({ match, compact = false }) {
  const showScore = match.status !== "SCHEDULED";
  return (
    <Link
      to={`/jogos/${match.id}`}
      className="card p-4 block hover:border-brand/40 hover:-translate-y-0.5 transition-all animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
        <span className="font-semibold">Rodada {match.round}</span>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamSide team={match.homeTeam} align="left" />

        <div className="flex flex-col items-center px-2 shrink-0">
          {showScore ? (
            <div className="text-2xl font-black tabular-nums flex items-center gap-2">
              <span className={match.homeScore > match.awayScore ? "text-brand-400" : ""}>{match.homeScore}</span>
              <span className="text-gray-600 text-lg">×</span>
              <span className={match.awayScore > match.homeScore ? "text-brand-400" : ""}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-gray-500 font-bold text-lg">×</div>
          )}
        </div>

        <TeamSide team={match.awayTeam} align="right" />
      </div>

      {!compact && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">{formatDateTime(match.kickoff)}</span>
          {showScore && (
            <button
              onClick={(e) => { e.preventDefault(); shareWhatsApp(match); }}
              className="text-brand-400 hover:text-brand font-semibold shrink-0 ml-2"
            >
              Compartilhar
            </button>
          )}
        </div>
      )}
    </Link>
  );
}

function TeamSide({ team, align }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamBadge team={team} size={36} />
      <span className="font-bold text-sm truncate">{team.shortName}</span>
    </div>
  );
}
