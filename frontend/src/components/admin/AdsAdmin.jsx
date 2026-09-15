import { useState } from "react";
import { api, resolveCrestUrl } from "../../api/client.js";
import { usePolling } from "../../hooks/usePolling.js";
import { Loader, EmptyState } from "../ui.jsx";
import Modal from "./Modal.jsx";

const SLOTS = [
  { value: "home-top", label: "Início · topo (abaixo do banner)" },
  { value: "home-bottom", label: "Início · rodapé" },
  { value: "jogos-topo", label: "Jogos · topo" },
];

const EMPTY = { title: "", imageUrl: "", linkUrl: "", slot: "home-top", active: true, order: 0 };
const MAX_SIZE_MB = 3;

export default function AdsAdmin() {
  const { data, loading, refetch } = usePolling(() => api.adsAll());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function openNew() { setForm(EMPTY); setEditing(null); setError(""); setOpen(true); }
  function openEdit(ad) {
    setForm({ title: ad.title, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl || "", slot: ad.slot, active: ad.active, order: ad.order });
    setEditing(ad.id); setError(""); setOpen(true);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Imagem muito grande (máximo ${MAX_SIZE_MB}MB).`); return; }
    setUploading(true); setError("");
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }

  async function save() {
    if (!form.imageUrl) { setError("Envie uma imagem para o banner."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, order: Number(form.order) || 0, linkUrl: form.linkUrl || null };
      if (editing) await api.updateAd(editing, payload);
      else await api.createAd(payload);
      setOpen(false); refetch(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function toggleActive(ad) {
    await api.updateAd(ad.id, { active: !ad.active });
    refetch(true);
  }

  async function remove(id) {
    if (!confirm("Excluir esta propaganda?")) return;
    await api.deleteAd(id); refetch(true);
  }

  if (loading && !data) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{data?.length || 0} propagandas cadastradas</p>
        <button onClick={openNew} className="btn-primary text-sm">+ Nova propaganda</button>
      </div>

      {!data?.length ? (
        <EmptyState icon="📢" title="Nenhuma propaganda cadastrada" subtitle="Cadastre banners de patrocinadores para exibir no site." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.map((ad) => (
            <div key={ad.id} className="card p-3 flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg border border-white/10 shrink-0 bg-white flex items-center justify-center overflow-hidden p-1">
                <img src={resolveCrestUrl(ad.imageUrl)} alt={ad.title} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{ad.title}</div>
                <div className="text-xs text-gray-500">{SLOTS.find((s) => s.value === ad.slot)?.label || ad.slot}</div>
              </div>
              <button onClick={() => toggleActive(ad)} className={`chip text-xs ${ad.active ? "bg-brand/20 text-brand-400" : "bg-white/5 text-gray-500"}`}>
                {ad.active ? "Ativa" : "Inativa"}
              </button>
              <button onClick={() => openEdit(ad)} className="btn-ghost text-xs py-1.5 px-2.5">Editar</button>
              <button onClick={() => remove(ad.id)} className="btn-danger text-xs py-1.5 px-2.5">Excluir</button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar propaganda" : "Nova propaganda"}
        footer={<>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </>}
      >
        {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
        <div className="space-y-3">
          <div><label className="label">Anunciante / título</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Mercado São José" /></div>

          <div>
            <label className="label">Banner</label>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <div className="w-20 h-14 rounded-lg border border-white/10 shrink-0 bg-white flex items-center justify-center overflow-hidden p-1">
                  <img src={resolveCrestUrl(form.imageUrl)} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-14 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-gray-600 text-xs shrink-0">sem imagem</div>
              )}
              <label className="btn-ghost text-sm flex-1 cursor-pointer text-center">
                {uploading ? "Enviando..." : "📁 Enviar imagem"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploading} onChange={handleFile} />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Banner horizontal ou logo com fundo transparente, ambos funcionam · até {MAX_SIZE_MB}MB</p>
          </div>

          <div><label className="label">Link ao clicar (opcional)</label><input className="input" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Posição</label>
              <select className="input" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
                {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="label">Ordem</label><input className="input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-brand" />
            Ativa (visível no site)
          </label>
        </div>
      </Modal>
    </div>
  );
}
