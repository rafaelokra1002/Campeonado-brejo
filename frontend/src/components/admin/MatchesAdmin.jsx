import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { usePolling } from "../../hooks/usePolling.js";
import { Loader, StatusBadge } from "../ui.jsx";
import { formatDateTime, PHASES, matchStageLabel } from "../../lib/format.js";
import Modal from "./Modal.jsx";
import LiveControl from "./LiveControl.jsx";

const EMPTY = { round: 1, phase: "GROUP", homeTeamId: "", awayTeamId: "", kickoff: "", venue: "", status: "SCHEDULED" };

// datetime-local precisa de "YYYY-MM-DDTHH:mm"
function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function MatchesAdmin() {
  const [teams, setTeams] = useState([]);
  const { data, loading, refetch } = usePolling(() => api.matches(), { interval: 10000 });
  const [phaseFilter, setPhaseFilter] = useState("GROUP");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [liveMatch, setLiveMatch] = useState(null);

  useEffect(() => { api.teams().then(setTeams); }, []);

  function openNew() {
    setForm({ ...EMPTY, phase: phaseFilter, kickoff: toLocalInput(), homeTeamId: teams[0]?.id || "", awayTeamId: teams[1]?.id || "" });
    setEditing(null); setError(""); setOpen(true);
  }
  function openEdit(m) {
    setForm({ round: m.round, phase: m.phase || "GROUP", homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, kickoff: toLocalInput(m.kickoff), venue: m.venue || "", status: m.status });
    setEditing(m.id); setError(""); setOpen(true);
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = { ...form, round: form.phase === "GROUP" ? Number(form.round) : 1, kickoff: new Date(form.kickoff).toISOString() };
      if (editing) await api.updateMatch(editing, payload);
      else await api.createMatch(payload);
      setOpen(false); refetch(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Excluir esta partida?")) return;
    await api.deleteMatch(id); refetch(true);
  }

  if (loading && !data) return <Loader />;

  const filtered = data?.filter((m) => (m.phase || "GROUP") === phaseFilter) || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPhaseFilter(p.key)}
            className={`chip text-sm ${phaseFilter === p.key ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{filtered.length} jogos</p>
        <button onClick={openNew} className="btn-primary text-sm" disabled={teams.length < 2}>+ Novo jogo</button>
      </div>

      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="card p-3 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge bg-white/5 text-gray-400">{matchStageLabel(m)}</span>
              <StatusBadge status={m.status} minute={m.minute} />
              <span className="ml-auto text-xs text-gray-500">{formatDateTime(m.kickoff)}</span>
            </div>
            <div className="font-semibold text-sm">
              {m.homeTeam.name} <span className="text-brand-400 whitespace-nowrap">{m.homeScore} × {m.awayScore}</span> {m.awayTeam.name}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLiveMatch(m)} className="btn-primary text-sm py-2 px-3 flex-1">⚽ Gols e cartões</button>
              <button onClick={() => openEdit(m)} className="btn-ghost text-sm py-2 px-3" title="Rodada, times, data, local e status">Dados</button>
              <button onClick={() => remove(m.id)} className="btn-danger text-sm py-2 px-3">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {/* Criar/editar jogo */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar jogo" : "Novo jogo"}
        footer={<>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </>}>
        {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
        <div className="space-y-3">
          <div><label className="label">Fase</label>
            <select className="input" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
              {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.phase === "GROUP" && (
              <div><label className="label">Rodada</label><input className="input" type="number" min={1} value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} /></div>
            )}
            <div className={form.phase === "GROUP" ? "" : "col-span-2"}><label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="SCHEDULED">Agendado</option>
                <option value="LIVE">Ao vivo</option>
                <option value="FINISHED">Encerrado</option>
              </select>
            </div>
          </div>
          <div><label className="label">Time da casa</label>
            <select className="input" value={form.homeTeamId} onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Time visitante</label>
            <select className="input" value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Data e hora</label><input className="input" type="datetime-local" value={form.kickoff} onChange={(e) => setForm({ ...form, kickoff: e.target.value })} /></div>
          <div><label className="label">Local</label><input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Estádio Municipal" /></div>
        </div>
      </Modal>

      {/* Controle ao vivo */}
      {liveMatch && (
        <LiveControl matchId={liveMatch.id} onClose={() => { setLiveMatch(null); refetch(true); }} />
      )}
    </div>
  );
}
