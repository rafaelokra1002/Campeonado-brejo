import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { usePush } from "../hooks/usePush.js";
import { useInstall } from "../hooks/useInstall.js";

// "Fique por dentro": maneiras de acompanhar o campeonato fora do site —
// avisos de gol no celular, canal do WhatsApp e instalar o app.
// Só aparece se houver pelo menos uma opção disponível neste aparelho.
export default function CommunityCard() {
  const push = usePush();
  const install = useInstall();
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    api.settings().then((s) => setWhatsappUrl(s.whatsappUrl || null)).catch(() => {});
  }, []);

  const canPush = push.status === "off" || push.status === "on";
  const pushBlocked = push.status === "denied";
  const canInstall = install.state === "prompt" || install.state === "ios";

  if (!canPush && !pushBlocked && !whatsappUrl && !canInstall) return null;

  return (
    <section className="card p-4 space-y-3">
      <h2 className="font-extrabold flex items-center gap-2">📣 Fique por dentro</h2>

      <div className="flex flex-wrap gap-2">
        {canPush && (
          <button
            type="button"
            onClick={push.status === "on" ? push.disable : push.enable}
            disabled={push.busy}
            className={push.status === "on" ? "btn-ghost text-sm border border-brand/40 text-brand-400" : "btn-primary text-sm"}
          >
            {push.busy ? "Aguarde..." : push.status === "on" ? "🔔 Avisos ativados (desativar)" : "🔔 Avisar quando sair gol"}
          </button>
        )}

        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
            💬 Canal do WhatsApp
          </a>
        )}

        {install.state === "prompt" && (
          <button type="button" onClick={install.install} className="btn-ghost text-sm border border-white/15">
            📲 Instalar app
          </button>
        )}
        {install.state === "ios" && (
          <button type="button" onClick={() => setShowIosTip((v) => !v)} className="btn-ghost text-sm border border-white/15">
            📲 Instalar app
          </button>
        )}
      </div>

      {showIosTip && (
        <p className="text-xs text-gray-400">
          No iPhone: toque em <span className="font-semibold text-gray-200">Compartilhar</span> (o quadrado com a setinha) e depois em{" "}
          <span className="font-semibold text-gray-200">Adicionar à Tela de Início</span>. Depois de instalar, dá pra ativar os avisos de gol.
        </p>
      )}
      {pushBlocked && (
        <p className="text-xs text-gray-400">
          As notificações estão bloqueadas neste navegador. Libere nas configurações do site pra receber os avisos de gol.
        </p>
      )}
    </section>
  );
}
