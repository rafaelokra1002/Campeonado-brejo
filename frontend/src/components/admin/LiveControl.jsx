import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import Modal from "./Modal.jsx";
import { TeamBadge } from "../ui.jsx";
import { matchStageLabel } from "../../lib/format.js";

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
    <Modal open title={`Gols e cartões · ${matchStageLabel(match)}`} onClose={onClose}
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

      {/* Lista de gols: editar (jogador/minuto) ou remover */}
      {match.goals?.length > 0 && (
        <div className="mt-4">
          <div className="label">Gols marcados</div>
          <div className="space-y-1">
            {match.goals.map((g) => (
              <EventRow
                key={g.id}
                icon="⚽"
                event={g}
                teamId={g.teamId}
                onSave={(data) => act(() => api.updateGoal(matchId, g.id, data))}
                onRemove={() => act(() => api.removeGoal(matchId, g.id))}
                busy={busy}
              />
            ))}
          </div>
        </div>
      )}
      {match.cards?.length > 0 && (
        <div className="mt-3">
          <div className="label">Cartões</div>
          <div className="space-y-1">
            {match.cards.map((c) => (
              <EventRow
                key={c.id}
                icon={c.type === "RED" ? "🟥" : "🟨"}
                event={c}
                teamId={c.teamId}
                showType
                onSave={(data) => act(() => api.updateCard(matchId, c.id, data))}
                onRemove={() => act(() => api.removeCard(matchId, c.id))}
                busy={busy}
              />
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

// Uma linha de gol/cartão já registrado, com opção de editar jogador/minuto
// (e tipo, no caso de cartão) ou remover.
function EventRow({ icon, event, teamId, showType, onSave, onRemove, busy }) {
  const [editing, setEditing] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(event.player?.id || "");
  const [minute, setMinute] = useState(event.minute ?? "");
  const [type, setType] = useState(event.type || "YELLOW");

  useEffect(() => {
    if (editing) api.players(teamId).then(setPlayers);
  }, [editing, teamId]);

  function save() {
    const data = { playerId: playerId || null, minute: minute === "" ? null : Number(minute) };
    if (showType) data.type = type;
    onSave(data);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
        <select className="input py-1 text-xs flex-1 min-w-[140px]" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
          <option value="">Sem jogador</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.number ? `${p.number} · ` : ""}{p.name}</option>)}
        </select>
        <input type="number" className="input py-1 text-xs w-16" placeholder="Min." value={minute} onChange={(e) => setMinute(e.target.value)} />
        {showType && (
          <select className="input py-1 text-xs w-24" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="YELLOW">🟨 Amarelo</option>
            <option value="RED">🟥 Vermelho</option>
          </select>
        )}
        <button disabled={busy} onClick={save} className="btn-primary text-xs py-1 px-2">Salvar</button>
        <button disabled={busy} onClick={() => setEditing(false)} className="btn-ghost text-xs py-1 px-2">Cancelar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
      <span className="min-w-0 flex-1">{icon} {event.minute ? `${event.minute}'` : ""} {event.player?.name || "—"} ({event.team.shortName})</span>
      <button disabled={busy} onClick={() => setEditing(true)} className="shrink-0 text-brand-400 text-xs font-semibold px-3 py-2 rounded-lg bg-brand/10">Editar</button>
      <button disabled={busy} onClick={onRemove} className="shrink-0 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg bg-red-500/10">Remover</button>
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
