import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import Modal from "./Modal.jsx";
import { TeamBadge } from "../ui.jsx";

// Painel de controle da partida em tempo real: status, placar, gols e cartões.
export default function LiveControl({ matchId, onClose }) {
  const [match, setMatch] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setMatch(await api.match(matchId));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [matchId]);

  async function act(fn) {
    setBusy(true);
    try { const updated = await fn(); if (updated) setMatch(updated); else await load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  const setStatus = (status) => act(() => api.updateScore(matchId, { status, minute: status === "LIVE" ? (match.minute || 1) : null }));
  const setMinute = (minute) => act(() => api.updateScore(matchId, { minute: Number(minute) }));

  if (!match) return <Modal open title="Carregando..." onClose={onClose}><div className="py-6 text-center text-gray-500">...</div></Modal>;

  return (
    <Modal open title={`Ao vivo · Rodada ${match.round}`} onClose={onClose}
      footer={<button onClick={onClose} className="btn-primary">Concluir</button>}>
      {/* Placar */}
      <div className="grid grid-cols-3 items-center gap-2 mb-4">
        <TeamCol team={match.homeTeam} />
        <div className="text-center text-4xl font-black tabular-nums">{match.homeScore} × {match.awayScore}</div>
        <TeamCol team={match.awayTeam} />
      </div>

      {/* Status */}
      <div className="flex gap-2 justify-center mb-4">
        {["SCHEDULED", "LIVE", "FINISHED"].map((s) => (
          <button key={s} disabled={busy} onClick={() => setStatus(s)}
            className={`chip ${match.status === s ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}>
            {s === "SCHEDULED" ? "Agendado" : s === "LIVE" ? "Ao vivo" : "Encerrado"}
          </button>
        ))}
      </div>

      {match.status === "LIVE" && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-gray-400">Minuto:</span>
          <input type="number" className="input w-20 text-center py-1.5" value={match.minute || 0}
            onChange={(e) => setMinute(e.target.value)} />
        </div>
      )}

      {/* Marcar gol / cartão por time */}
      <div className="grid grid-cols-2 gap-3">
        <TeamActions match={match} team={match.homeTeam} act={act} matchId={matchId} busy={busy} />
        <TeamActions match={match} team={match.awayTeam} act={act} matchId={matchId} busy={busy} />
      </div>

      {/* Lista de gols para remover */}
      {match.goals?.length > 0 && (
        <div className="mt-4">
          <div className="label">Gols marcados</div>
          <div className="space-y-1">
            {match.goals.map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-1.5">
                <span>⚽ {g.minute ? `${g.minute}'` : ""} {g.player?.name || "—"} ({g.team.shortName})</span>
                <button disabled={busy} onClick={() => act(() => api.removeGoal(matchId, g.id))} className="ml-auto text-red-400 text-xs">remover</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {match.cards?.length > 0 && (
        <div className="mt-3">
          <div className="label">Cartões</div>
          <div className="space-y-1">
            {match.cards.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-1.5">
                <span>{c.type === "RED" ? "🟥" : "🟨"} {c.minute ? `${c.minute}'` : ""} {c.player?.name || "—"} ({c.team.shortName})</span>
                <button disabled={busy} onClick={() => act(() => api.removeCard(matchId, c.id))} className="ml-auto text-red-400 text-xs">remover</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function TeamCol({ team }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <TeamBadge team={team} size={44} />
      <span className="text-xs font-bold">{team.shortName}</span>
    </div>
  );
}

// Botões de gol/cartão com seleção opcional de jogador e minuto.
function TeamActions({ match, team, act, matchId, busy }) {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState("");
  const [minute, setMinute] = useState("");

  useEffect(() => { api.players(team.id).then(setPlayers); }, [team.id]);

  const min = minute ? Number(minute) : (match.status === "LIVE" ? match.minute : null);

  return (
    <div className="card p-3 space-y-2">
      <div className="font-bold text-sm text-center">{team.shortName}</div>
      <select className="input py-1.5 text-sm" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
        <option value="">Jogador (opcional)</option>
        {players.map((p) => <option key={p.id} value={p.id}>{p.number ? `${p.number} · ` : ""}{p.name}</option>)}
      </select>
      <input type="number" className="input py-1.5 text-sm" placeholder="Minuto" value={minute} onChange={(e) => setMinute(e.target.value)} />
      <button disabled={busy} onClick={() => act(() => api.addGoal(matchId, { teamId: team.id, playerId: playerId || null, minute: min }))}
        className="btn-primary w-full text-sm py-1.5">⚽ Gol</button>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={() => act(() => api.addCard(matchId, { teamId: team.id, playerId: playerId || null, type: "YELLOW", minute: min }))}
          className="btn-ghost text-sm py-1.5">🟨</button>
        <button disabled={busy} onClick={() => act(() => api.addCard(matchId, { teamId: team.id, playerId: playerId || null, type: "RED", minute: min }))}
          className="btn-ghost text-sm py-1.5">🟥</button>
      </div>
    </div>
  );
}
