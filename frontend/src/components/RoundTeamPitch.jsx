import { Link } from "react-router-dom";
import { resolveCrestUrl } from "../api/client.js";
import { TeamBadge } from "./ui.jsx";

// Linhas do campo, do ataque (topo) ao goleiro (base).
const LINES = [
  ["Atacante"],
  ["Meia", "Volante"],
  ["Lateral", "Zagueiro"],
  ["Goleiro"],
];

// Jogador sem posição cadastrada entra no meio-campo.
function lineIndex(position) {
  const i = LINES.findIndex((names) => names.includes(position));
  return i === -1 ? 1 : i;
}

// Seleção da rodada desenhada num campinho. `picks` vem da API (/round-teams).
export default function RoundTeamPitch({ picks }) {
  const rows = LINES.map(() => []);
  for (const pick of picks) rows[lineIndex(pick.player.position)].push(pick);

  const mvp = picks.find((p) => p.isMvp);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-green-700 to-green-900 px-2 py-5">
        {/* marcações do campo */}
        <div className="absolute inset-2 rounded-xl border border-white/20 pointer-events-none" />
        <div className="absolute left-2 right-2 top-1/2 border-t border-white/20 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 pointer-events-none" />

        <div className="relative flex flex-col justify-between gap-5 min-h-[420px]">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-around items-start gap-1">
              {row.map((pick) => <PlayerChip key={pick.id} pick={pick} />)}
            </div>
          ))}
        </div>
      </div>

      {mvp && (
        <p className="mt-3 text-sm text-gray-300 text-center">
          ⭐ Craque da rodada: <span className="font-bold text-white">{mvp.player.name}</span>{" "}
          <span className="text-gray-500">({mvp.player.team.name})</span>
        </p>
      )}
    </div>
  );
}

function PlayerChip({ pick }) {
  const { player, isMvp } = pick;
  return (
    <Link to={`/jogadores/${player.id}`} className="flex flex-col items-center w-[72px] sm:w-24 text-center">
      <div className="relative">
        {player.photo ? (
          <img
            src={resolveCrestUrl(player.photo)}
            alt={player.name}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 ${isMvp ? "border-yellow-300" : "border-white/70"}`}
          />
        ) : (
          <span
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-night-900/80 flex items-center justify-center font-black text-lg border-2 ${isMvp ? "border-yellow-300" : "border-white/40"}`}
          >
            {player.number ?? "–"}
          </span>
        )}
        <span className="absolute -bottom-1 -right-1 rounded-full bg-night-950 p-0.5">
          <TeamBadge team={player.team} size={20} />
        </span>
        {isMvp && <span className="absolute -top-2 -right-2 text-lg leading-none drop-shadow">⭐</span>}
      </div>
      <span className="mt-1.5 text-[11px] sm:text-xs font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
        {player.name}
      </span>
    </Link>
  );
}
