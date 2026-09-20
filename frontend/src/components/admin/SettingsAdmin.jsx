import { useEffect, useState } from "react";
import { api, resolveCrestUrl } from "../../api/client.js";
import { Loader } from "../ui.jsx";

const MAX_SIZE_MB = 5;

export default function SettingsAdmin() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.settings().then((s) => setForm({ organizerName: s.organizerName || "", bannerImage: s.bannerImage || "", streamUrl: s.streamUrl || "", whatsappUrl: s.whatsappUrl || "" }));
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Imagem muito grande (máximo ${MAX_SIZE_MB}MB).`); return; }
    setUploading(true); setError(""); setSaved(false);
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, bannerImage: url }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.updateSettings(form);
      setSaved(true);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  if (!form) return <Loader />;

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="font-bold mb-1">Banner da página inicial</h2>
        <p className="text-sm text-gray-400">Foto de capa, nome do organizador e contador de seguidores exibidos no topo do site.</p>
      </div>

      {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-xl px-3 py-2">{error}</div>}
      {saved && <div className="bg-brand/10 text-brand-400 text-sm rounded-xl px-3 py-2">Configurações salvas.</div>}

      <div>
        <label className="label">Foto de capa</label>
        {form.bannerImage ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 mb-2">
            <img src={resolveCrestUrl(form.bannerImage)} alt="" className="w-full h-32 object-cover" />
            <button onClick={() => setForm({ ...form, bannerImage: "" })} className="absolute top-2 right-2 btn-danger text-xs py-1 px-2">Remover</button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 h-32 flex items-center justify-center text-gray-600 text-sm mb-2">
            Sem foto de capa (usando fundo padrão)
          </div>
        )}
        <label className="btn-ghost text-sm w-full cursor-pointer text-center block">
          {uploading ? "Enviando..." : "📁 Enviar foto de capa"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={handleFile} />
        </label>
        <p className="text-xs text-gray-500 mt-1.5">Formato horizontal (ex: 1200×500) · até {MAX_SIZE_MB}MB</p>
      </div>

      <div>
        <label className="label">Nome do organizador</label>
        <input
          className="input"
          value={form.organizerName}
          onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
          placeholder="Ex: Uermerson Costa"
        />
      </div>

      <div>
        <h2 className="font-bold mb-1 mt-2">Transmissão ao vivo</h2>
        <label className="label">Link do YouTube (vídeo ou live)</label>
        <input
          className="input"
          value={form.streamUrl}
          onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
        />
        <p className="text-xs text-gray-500 mt-1.5">
          Cole o link do vídeo/live do YouTube. Deixe em branco pra esconder essa parte do site.
        </p>
      </div>

      <div>
        <h2 className="font-bold mb-1 mt-2">Canal do WhatsApp</h2>
        <label className="label">Link do canal ou grupo</label>
        <input
          className="input"
          value={form.whatsappUrl}
          onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
          placeholder="https://whatsapp.com/channel/... ou https://chat.whatsapp.com/..."
        />
        <p className="text-xs text-gray-500 mt-1.5">
          Aparece na Home como botão "Canal do WhatsApp". Deixe em branco pra esconder.
        </p>
      </div>

      <button onClick={save} className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</button>
    </div>
  );
}
