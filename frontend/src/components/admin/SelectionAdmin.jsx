import { useEffect, useState } from "react";
import { api, resolveCrestUrl } from "../../api/client.js";
import { Loader, TeamBadge } from "../ui.jsx";
import { PHASES } from "../../lib/format.js";

const MAX = 11;
const POSITION_ORDER = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"];

function positionRank(position) {
  const i = POSITION_ORDER.indexOf(position);
  return i === -1 ? POSITION_ORDER.length : i;
}

// Montagem da "Seleção da rodada": até 11 jogadores + craque da rodada.
export default function SelectionAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [saved, setSaved] = useState([]); // seleções já cadastradas

  const [phase, setPhase] = useState("GROUP");
  const [round, setRound] = useState(1);
  const [picks, setPicks] = useState([]); // [{ playerId, isMvp }]
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    Promise.all([api.teams(), api.players(), api.rounds(), api.roundTeams()]).then(([t, p, r, s]) => {
      setTeams(t);
      setPlayers(p);
      setRounds(r);
      setSaved(s);
      setTeamId(t[0]?.id || "");
      if (r.length) setRound(r[r.length - 1]);
      setLoaded(true);
    }).catch((e) => { setError(e.message); setLoaded(true); });
  }, []);

  const effectiveRound = phase === "GROUP" ? Number(round) : 1;
  const existing = saved.find((s) => s.phase === phase && s.round === effectiveRound);

  // Ao trocar de fase/rodada (ou recarregar as salvas), mostra a seleção dessa rodada.
  useEffect(() => {
    setPicks(existing ? existing.picks.map((p) => ({ playerId: p.player.id, isMvp: p.isMvp })) : []);
    setOk("");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, effectiveRound, saved]);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const pickedIds = new Set(picks.map((p) => p.playerId));
  const available = players.filter((p) => p.teamId === teamId && !pickedIds.has(p.id));
  const sortedPicks = [...picks].sort(
    (a, b) => positionRank(playerById.get(a.playerId)?.position) - positionRank(playerById.get(b.playerId)?.position)
  );

  function add() {
    if (!playerId || picks.length >= MAX) return;
    setPicks([...picks, { playerId, isMvp: false }]);
    setPlayerId("");
    setOk("");
  }
  function remove(id) {
    setPicks(picks.filter((p) => p.playerId !== id));
    setOk("");
  }
  function toggleMvp(id) {
    setPicks(picks.map((p) => ({ ...p, isMvp: p.playerId === id ? !p.isMvp : false })));
    setOk("");
  }

  async function reload() {
    setSaved(await api.roundTeams());
  }

  async function save() {
    setBusy(true); setError(""); setOk("");
    try {
      await api.saveRoundTeam({ phase, round: effectiveRound, picks });
      await reload();
      setOk(picks.length ? "Seleção salva." : "Seleção vazia: não aparece no site.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function clear() {
    if (!existing || !confirm("Apagar a seleção dessa rodada?")) return;
    setBusy(true); setError(""); setOk("");
    try {
      await api.deleteRoundTeam(existing.id);
      await reload();
      setOk("Seleção apagada.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!loaded) return <Loader />;

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="font-bold mb-1">Seleção da rodada</h2>
        <p className="text-sm text-gray-400">Escolha até {MAX} jogadores e marque o craque da rodada. Aparece na Home e na página de Seleção.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fase</label>
          <select className="input" value={phase} onChange={(e) => setPhase(e.target.value)}>
            {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        {phase === "GROUP" && (
          <div>
            <label className="label">Rodada</label>
            <select className="input" value={round} onChange={(e) => setRound(Number(e.target.value))}>
              {(rounds.length ? rounds : [1]).map((r) => (
                <option key={r} value={r}>
                  Rodada {r}{saved.some((s) => s.phase === "GROUP" && s.round === r) ? " ✓" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2">{error}</div>}
      {ok && <div className="bg-brand/10 text-brand-400 text-sm rounded-xl px-3 py-2">{ok}</div>}

      {/* Adicionar jogador */}
      <div className="card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select className="input py-1.5 text-sm" value={teamId} onChange={(e) => { setTeamId(e.target.value); setPlayerId(""); }}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="input py-1.5 text-sm" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Jogador...</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.number ? `${p.number} · ` : ""}{p.name}{p.position ? ` (${p.position})` : ""}</option>
            ))}
          </select>
        </div>
        <button onClick={add} disabled={!playerId || picks.length >= MAX} className="btn-primary text-sm w-full">
          {picks.length >= MAX ? `Seleção completa (${MAX}/${MAX})` : "+ Adicionar à seleção"}
        </button>
      </div>

      {/* Escolhidos */}
      <div>
        <div className="label">Escolhidos ({picks.length}/{MAX})</div>
        {sortedPicks.length ? (
          <div className="card divide-y divide-white/5">
            {sortedPicks.map((pick) => {
              const p = playerById.get(pick.playerId);
              if (!p) return null;
              return (
                <div key={pick.playerId} className="flex items-center gap-3 p-2.5">
                  {p.photo ? (
                    <img src={resolveCrestUrl(p.photo)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center font-black text-sm text-gray-400 shrink-0">{p.number ?? "–"}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <TeamBadge team={p.team} size={14} /> {p.team?.shortName} · {p.position || "sem posição"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMvp(pick.playerId)}
                    title="Craque da rodada"
                    className={`text-xl leading-none ${pick.isMvp ? "" : "opacity-30 hover:opacity-70"}`}
                  >
                    ⭐
                  </button>
                  <button onClick={() => remove(pick.playerId)} className="text-red-400 text-xs">remover</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-4 text-center text-sm text-gray-500">Nenhum jogador escolhido ainda.</div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? "Salvando..." : "Salvar seleção"}</button>
        {existing && <button onClick={clear} disabled={busy} className="btn-danger">Apagar</button>}
      </div>
    </div>
  );
}
