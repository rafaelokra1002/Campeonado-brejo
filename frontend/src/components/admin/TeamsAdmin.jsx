import { useState } from "react";
import { api } from "../../api/client.js";
import { usePolling } from "../../hooks/usePolling.js";
import { Loader, TeamBadge } from "../ui.jsx";
import Modal from "./Modal.jsx";

const EMPTY = { name: "", shortName: "", crest: "", city: "", founded: "", color: "#22c55e", group: "A" };
const MAX_SIZE_MB = 3;

export default function TeamsAdmin() {
  const { data, loading, refetch } = usePolling(() => api.teams());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function openNew() { setForm(EMPTY); setEditing(null); setError(""); setOpen(true); }
  function openEdit(t) {
    setForm({ name: t.name, shortName: t.shortName, crest: t.crest || "", city: t.city || "", founded: t.founded || "", color: t.color || "#22c55e", group: t.group || "A" });
    setEditing(t.id); setError(""); setOpen(true);
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
      setForm((f) => ({ ...f, crest: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = { ...form, founded: form.founded ? Number(form.founded) : null };
      if (editing) await api.updateTeam(editing, payload);
      else await api.createTeam(payload);
      setOpen(false); refetch(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Excluir este time? Jogadores e jogos vinculados serão afetados.")) return;
    await api.deleteTeam(id); refetch(true);
  }

  if (loading && !data) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{data?.length || 0} times cadastrados</p>
        <button onClick={openNew} className="btn-primary text-sm">+ Novo time</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data?.map((t) => (
          <div key={t.id} className="card p-3 flex items-center gap-3">
            <TeamBadge team={t} size={40} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{t.name}</div>
              <div className="text-xs text-gray-500">{t.shortName} · {t._count?.players ?? 0} jogadores</div>
            </div>
            <button onClick={() => openEdit(t)} className="btn-ghost text-xs py-1.5 px-2.5">Editar</button>
            <button onClick={() => remove(t.id)} className="btn-danger text-xs py-1.5 px-2.5">Excluir</button>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar time" : "Novo time"}
        footer={<>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </>}
      >
        {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
        <div className="space-y-3">
          <div><label className="label">Nome</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Sigla (2-5)</label><input className="input" maxLength={5} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })} /></div>

          <div>
            <label className="label">Escudo do time</label>
            <div className="flex items-center gap-3">
              <TeamBadge team={{ crest: form.crest, color: form.color, shortName: form.shortName || "?", name: form.name }} size={56} />
              <div className="flex-1 space-y-2">
                <label className="btn-ghost text-sm w-full cursor-pointer">
                  {uploading ? "Enviando..." : "📁 Enviar imagem do computador"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" disabled={uploading} onChange={handleFile} />
                </label>
                <input
                  className="input text-sm"
                  value={form.crest}
                  onChange={(e) => setForm({ ...form, crest: e.target.value })}
                  placeholder="ou cole uma URL / emoji, ex: 🦁"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">PNG, JPG, WEBP, SVG ou GIF · até {MAX_SIZE_MB}MB</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Grupo</label>
              <select className="input" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
            <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="label">Fundação</label><input className="input" type="number" value={form.founded} onChange={(e) => setForm({ ...form, founded: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Cor do time</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <input className="input flex-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
