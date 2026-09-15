export function formatDate(iso, opts = {}) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", ...opts });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso) {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export const STATUS = {
  SCHEDULED: { label: "Agendado", color: "text-gray-300 bg-white/10" },
  LIVE: { label: "Ao vivo", color: "text-white bg-red-500" },
  FINISHED: { label: "Encerrado", color: "text-brand-400 bg-brand/10" },
};

// Compartilhar resultado no WhatsApp
export function shareWhatsApp(match) {
  const line = `⚽ ${match.homeTeam.shortName} ${match.homeScore} x ${match.awayScore} ${match.awayTeam.shortName}`;
  const status = match.status === "LIVE" ? " (AO VIVO)" : match.status === "FINISHED" ? " (Final)" : "";
  const text = `${line}${status}\nCampeonato Brejolandense · Rodada ${match.round}\n${window.location.origin}/jogos/${match.id}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

// Compartilhar a página atual: usa o share nativo do celular quando disponível,
// senão cai para o WhatsApp Web.
export async function shareSite(title = "Campeonato Brejolandense") {
  const url = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch { /* usuário cancelou */ }
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, "_blank");
}
