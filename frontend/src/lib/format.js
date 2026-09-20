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

export const PHASES = [
  { key: "GROUP", label: "1ª Fase" },
  { key: "QUARTER", label: "Quartas de Final" },
  { key: "SEMI", label: "Semifinal" },
  { key: "FINAL", label: "Final" },
];

export function phaseLabel(phase) {
  return PHASES.find((p) => p.key === phase)?.label || "1ª Fase";
}

// Rótulo de "onde" a partida está: "Rodada X" na fase de grupos, ou o nome
// da fase (Quartas/Semifinal/Final) no mata-mata.
export function matchStageLabel(match) {
  return !match.phase || match.phase === "GROUP" ? `Rodada ${match.round}` : phaseLabel(match.phase);
}

export const STATUS = {
  SCHEDULED: { label: "Agendado", color: "text-gray-300 bg-white/10" },
  LIVE: { label: "Ao vivo", color: "text-white bg-red-500" },
  FINISHED: { label: "Encerrado", color: "text-brand-400 bg-brand/10" },
};

// Primeiro nome do time (ex: "Ponta D'Água" -> "Ponta"), usado nos lugares
// compactos que hoje mostram a sigla (VIL, PDA...) e ficam difíceis de ler.
export function teamFirstName(name) {
  return name ? name.split(" ")[0] : "";
}

// Converte um link "normal" do YouTube (watch, youtu.be, live, shorts) na URL
// de embed usada no <iframe>. Retorna null se não conseguir reconhecer um ID.
export function youtubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const match = u.pathname.match(/^\/(embed|live|shorts)\/([^/?]+)/);
      if (match) return `https://www.youtube.com/embed/${match[2]}`;
    }
  } catch {
    return null;
  }
  return null;
}

// Compartilhar resultado no WhatsApp
export function shareWhatsApp(match) {
  const line = `⚽ ${teamFirstName(match.homeTeam.name)} ${match.homeScore} x ${match.awayScore} ${teamFirstName(match.awayTeam.name)}`;
  const status = match.status === "LIVE" ? " (AO VIVO)" : match.status === "FINISHED" ? " (Final)" : "";
  const text = `${line}${status}\nCampeonato Brejolandense · Rodada ${match.round}\n${window.location.origin}/jogos/${match.id}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

// Compartilhar a classificação (por grupo) no WhatsApp, em formato de texto.
export function shareStandings(standingsByGroup) {
  const groups = Object.keys(standingsByGroup).sort();
  const lines = ["📊 Classificação · Campeonato Brejolandense", ""];
  for (const g of groups) {
    lines.push(`GRUPO ${g}`);
    for (const row of standingsByGroup[g]) {
      lines.push(`${row.position}º ${row.name} - ${row.points} pts`);
    }
    lines.push("");
  }
  lines.push(`${window.location.origin}/tabela`);
  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
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
