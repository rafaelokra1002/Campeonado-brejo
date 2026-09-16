import { Link } from "react-router-dom";
import { TeamBadge, FormBadge } from "./ui.jsx";

// zonas: nº de times classificados (verde) e rebaixados (vermelho)
export default function StandingsTable({ rows, compact = false, promotion = 4, relegation = 0 }) {
  const total = rows.length;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase border-b border-white/10">
              <th className="text-left py-3 pl-4 pr-2 font-semibold">#</th>
              <th className="text-left py-3 px-2 font-semibold">Time</th>
              <th className="py-3 px-2 font-bold text-brand-400">P</th>
              <th className="py-3 px-2 font-semibold">J</th>
              {!compact && <><th className="py-3 px-2 font-semibold">V</th><th className="py-3 px-2 font-semibold">E</th><th className="py-3 px-2 font-semibold">D</th><th className="py-3 px-2 font-semibold">GP</th><th className="py-3 px-2 font-semibold">GC</th></>}
              <th className="py-3 px-2 font-semibold">SG</th>
              {!compact && <th className="py-3 px-2 pr-4 font-semibold hidden sm:table-cell">Últimos</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const zone =
                row.position <= promotion
                  ? "border-l-brand"
                  : relegation && row.position > total - relegation
                  ? "border-l-red-500"
                  : "border-l-transparent";
              return (
                <tr key={row.teamId} className={`border-b border-white/5 border-l-4 ${zone} hover:bg-white/5 transition`}>
                  <td className="py-2.5 pl-4 pr-2 font-bold text-gray-400">{row.position}</td>
                  <td className="py-2.5 px-2">
                    <Link to={`/times/${row.teamId}`} className="flex items-center gap-2 hover:text-brand-400 transition">
                      <TeamBadge team={row} size={34} />
                      <span className="font-semibold truncate max-w-[9rem] sm:max-w-none">
                        {compact ? row.shortName : row.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-brand-400">{row.points}</td>
                  <td className="py-2.5 px-2 text-center text-gray-400">{row.played}</td>
                  {!compact && <>
                    <td className="py-2.5 px-2 text-center">{row.wins}</td>
                    <td className="py-2.5 px-2 text-center">{row.draws}</td>
                    <td className="py-2.5 px-2 text-center">{row.losses}</td>
                    <td className="py-2.5 px-2 text-center">{row.goalsFor}</td>
                    <td className="py-2.5 px-2 text-center">{row.goalsAgainst}</td>
                  </>}
                  <td className="py-2.5 px-2 text-center font-semibold">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  {!compact && (
                    <td className="py-2.5 px-2 pr-4 hidden sm:table-cell">
                      <div className="flex gap-1 justify-center">
                        {row.form.length ? row.form.map((f, i) => <FormBadge key={i} result={f} />) : <span className="text-gray-600">—</span>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!compact && promotion > 0 && (
        <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-gray-400 border-t border-white/5">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand" /> Zona de classificação</span>
          {relegation > 0 && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Zona de rebaixamento</span>}
        </div>
      )}
    </div>
  );
}
