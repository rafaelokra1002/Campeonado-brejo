import { useState } from "react";
import { api, resolveCrestUrl } from "../api/client.js";
import { TeamBadge } from "./ui.jsx";

// Votação da torcida no craque da rodada, entre os jogadores da seleção.
// Um voto por aparelho (guardado no navegador). Use `key={roundTeam.id}` ao trocar de rodada.
export default function FanVote({ roundTeam, onVoted }) {
  const storageKey = `brejo_mvp_vote_${roundTeam.id}`;
  const [voted, setVoted] = useState(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const total = roundTeam.picks.reduce((sum, p) => sum + p.votes, 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const picks = voted ? [...roundTeam.picks].sort((a, b) => b.votes - a.votes) : roundTeam.picks;

  async function vote(pick) {
    if (voted || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.votePick(pick.id);
      try { localStorage.setItem(storageKey, pick.id); } catch { /* modo privado etc. */ }
      setVoted(pick.id);
      onVoted?.();
    } catch (e) {
      setError(e.message || "Não foi possível registrar seu voto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-1">🗳️ Craque da rodada: vote na torcida</h3>
      <p className="text-xs text-gray-500 mb-4">
        {voted ? "Obrigado pelo voto! Confira como está a votação." : "Escolha o melhor jogador da seleção. Só dá pra votar uma vez."}
      </p>

      <div className="space-y-2">
        {picks.map((pick) => {
          const p = pick.player;
          const mine = voted === pick.id;
          return (
            <button
              key={pick.id}
              type="button"
              onClick={() => vote(pick)}
              disabled={!!voted || busy}
              className={`w-full text-left rounded-xl border overflow-hidden relative transition ${
                mine ? "border-brand" : "border-white/10"
              } ${voted ? "cursor-default" : "hover:border-brand/50 cursor-pointer"}`}
            >
              {voted && <div className="absolute inset-y-0 left-0 bg-brand/15" style={{ width: `${pct(pick.votes)}%` }} />}
              <div className="relative flex items-center gap-3 px-3 py-2">
                {p.photo ? (
                  <img src={resolveCrestUrl(p.photo)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center font-black text-sm text-gray-400 shrink-0">
                    {p.number ?? "–"}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {p.name} {pick.isMvp && <span title="Craque escolhido pelo admin">⭐</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <TeamBadge team={p.team} size={14} /> {p.team.name}
                  </div>
                </div>
                {voted && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-brand-400">{pct(pick.votes)}%</div>
                    <div className="text-[10px] text-gray-500">{pick.votes} {pick.votes === 1 ? "voto" : "votos"}{mine && " · seu voto"}</div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      <p className="text-xs text-gray-500 mt-3">{total} {total === 1 ? "voto" : "votos"} da torcida</p>
    </div>
  );
}
