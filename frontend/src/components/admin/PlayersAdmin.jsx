import { useEffect, useState } from "react";
import { api, resolveCrestUrl } from "../../api/client.js";
import { usePolling } from "../../hooks/usePolling.js";
import { Loader, TeamBadge } from "../ui.jsx";
import Modal from "./Modal.jsx";

const POSITIONS = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"];
const EMPTY = { name: "", number: "", position: "", photo: "", teamId: "" };
const MAX_SIZE_MB = 3;

export default function PlayersAdmin() {
  const [teams, setTeams] = useState([]);
  const [teamFilter, setTeamFilter] = useState("");
  const { data, loading, refetch } = usePolling(() => api.players(teamFilter || undefined), { deps: [teamFilter] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api.teams().then(setTeams); }, []);

  function openNew() { setForm({ ...EMPTY, teamId: teamFilter || teams[0]?.id || "" }); setEditing(null); setError(""); setOpen(true); }
  function openEdit(p) {
    setForm({ name: p.name, number: p.number || "", position: p.position || "", photo: p.photo || "", teamId: p.teamId });
    setEditing(p.id); setError(""); setOpen(true);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Imagem muito grande (máximo ${MAX_SIZE_MB}MB).`);
      return;
    }
    setUploading(true); setError("");
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, photo: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = { ...form, number: form.number ? Number(form.number) : null };
      if (editing) await api.updatePlayer(editing, payload);
      else await api.createPlayer(payload);
      setOpen(false); refetch(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Excluir este jogador?")) return;
    await api.deletePlayer(id); refetch(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <select className="input max-w-xs" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">Todos os times</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={openNew} className="btn-primary text-sm" disabled={!teams.length}>+ Novo jogador</button>
      </div>

      {loading && !data ? <Loader /> : (
        <div className="card divide-y divide-white/5">
          {data?.length ? data.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              {p.photo ? (
                <img src={resolveCrestUrl(p.photo)} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center font-black text-sm text-gray-400 shrink-0">{p.number ?? "–"}</span>
              )}
              <TeamBadge team={p.team} size={28} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{p.position || "—"} · {p.team?.shortName}</div>
              </div>
              <button onClick={() => openEdit(p)} className="btn-ghost text-xs py-1.5 px-2.5">Editar</button>
              <button onClick={() => remove(p.id)} className="btn-danger text-xs py-1.5 px-2.5">Excluir</button>
            </div>
          )) : <div className="p-6 text-center text-gray-500 text-sm">Nenhum jogador.</div>}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar jogador" : "Novo jogador"}
        footer={<>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </>}>
        {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
        <div className="space-y-3">
          <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

          <div>
            <label className="label">Foto do jogador</label>
            <div className="flex items-center gap-3">
              {form.photo ? (
                <img src={resolveCrestUrl(form.photo)} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl text-gray-500 shrink-0">🙂</span>
              )}
              <div className="flex-1 space-y-2">
                <label className="btn-ghost text-sm w-full cursor-pointer">
                  {uploading ? "Enviando..." : "📁 Enviar foto do computador"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploading} onChange={handleFile} />
                </label>
                <input
                  className="input text-sm"
                  value={form.photo}
                  onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  placeholder="ou cole uma URL"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">PNG, JPG, WEBP ou GIF · até {MAX_SIZE_MB}MB (opcional)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Número</label><input className="input" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
            <div><label className="label">Posição</label>
              <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="">—</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Time</label>
            <select className="input" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
