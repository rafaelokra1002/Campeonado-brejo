import { STATUS } from "../lib/format.js";
import { resolveCrestUrl } from "../api/client.js";

// Escudo do time (upload/URL/emoji, com fallback para inicial colorida).
export function TeamBadge({ team, size = 40 }) {
  if (!team) return null;
  // Upload próprio (/api/uploads/...) e URL externa (http...) são imagem; o resto é emoji/texto.
  const isUrl = team.crest && (/^https?:\/\//.test(team.crest) || team.crest.startsWith("/"));
  const isEmoji = team.crest && !isUrl;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 font-bold overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `${team.color || "#22c55e"}22`,
        border: `2px solid ${team.color || "#22c55e"}55`,
        fontSize: size * 0.5,
      }}
      title={team.name}
    >
      {isUrl ? (
        <img src={resolveCrestUrl(team.crest)} alt={team.name} className="w-full h-full object-cover" />
      ) : isEmoji ? (
        team.crest
      ) : (
        <span style={{ color: team.color || "#22c55e", fontSize: size * 0.4 }}>
          {team.shortName?.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

export function StatusBadge({ status, minute }) {
  const s = STATUS[status] || STATUS.SCHEDULED;
  return (
    <span className={`badge ${s.color}`}>
      {status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-live" />}
      {status === "LIVE" && minute ? `${minute}'` : s.label}
    </span>
  );
}

export function Loader({ label = "Carregando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
      <div className="w-10 h-10 border-4 border-white/10 border-t-brand rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, subtitle }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-semibold text-gray-300">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-extrabold flex items-center gap-2">{children}</h2>
      {action}
    </div>
  );
}

export function FormBadge({ result }) {
  const map = {
    V: "bg-brand text-night-950",
    E: "bg-yellow-500/80 text-night-950",
    D: "bg-red-500 text-white",
  };
  return (
    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${map[result] || "bg-white/10"}`}>
      {result}
    </span>
  );
}
