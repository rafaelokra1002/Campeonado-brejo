import {
  C,
  FONT,
  ensureFonts,
  loadImage,
  loadCrestImage,
  roundRectPath,
  fitText,
  drawCrest,
  canvasToFiles,
} from "./canvasShare.js";
import { formatDateTime, matchStageLabel, teamFirstName } from "./format.js";

// Imagem (PNG) e PDF de uma partida: placar, escudos, data/local e lances.

const W = 1200;
const PAD = 48;
const SCALE = 2;
const HEADER_H = 190;
const CARD_H = 410;
const ROW_H = 64;

const STATUS = {
  SCHEDULED: { label: "AGENDADO", bg: "rgba(148,163,184,0.18)", fg: "#cbd5e1" },
  LIVE: { label: "AO VIVO", bg: "#ef4444", fg: "#ffffff" },
  FINISHED: { label: "ENCERRADO", bg: "rgba(74,222,128,0.16)", fg: C.brand },
};

function buildEvents(match) {
  const teamOf = (teamId) => (teamId === match.homeTeam.id ? match.homeTeam : match.awayTeam);
  const events = [];

  for (const g of match.goals || []) {
    events.push({
      minute: g.minute,
      kind: "goal",
      text: `${g.player?.name || "Gol"}${g.penalty ? " (pên.)" : ""}${g.ownGoal ? " (contra)" : ""}`,
      team: teamFirstName(teamOf(g.teamId).name),
    });
  }
  for (const c of match.cards || []) {
    events.push({
      minute: c.minute,
      kind: c.type === "RED" ? "red" : "yellow",
      text: c.player?.name || (c.type === "RED" ? "Cartão vermelho" : "Cartão amarelo"),
      team: teamFirstName(teamOf(c.teamId).name),
    });
  }
  return events.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
}

export async function renderMatchCanvas(match) {
  await ensureFonts();

  const [logo, homeImg, awayImg] = await Promise.all([
    loadImage("/logo-192.png"),
    loadCrestImage(match.homeTeam.crest),
    loadCrestImage(match.awayTeam.crest),
  ]);

  const showScore = match.status !== "SCHEDULED";
  const events = buildEvents(match);
  const hasEventsSection = showScore;
  const rows = Math.max(events.length, 1);
  const eventsH = hasEventsSection ? 56 + rows * ROW_H + 8 + 36 : 0;
  const H = HEADER_H + CARD_H + 40 + eventsH + 110;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Fundo
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 100, 0, 0, W - 100, 0, 520);
  glow.addColorStop(0, "rgba(34,197,94,0.16)");
  glow.addColorStop(1, "rgba(34,197,94,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 520);

  // Cabeçalho
  let textX = PAD;
  if (logo) {
    ctx.save();
    roundRectPath(ctx, PAD, 44, 92, 92, 18);
    ctx.clip();
    ctx.drawImage(logo, PAD, 44, 92, 92);
    ctx.restore();
    textX = PAD + 116;
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.text;
  ctx.font = `900 42px ${FONT}`;
  ctx.fillText("CAMPEONATO BREJOLANDENSE", textX, 92);
  ctx.fillStyle = C.brand;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(matchStageLabel(match).toUpperCase(), textX, 130);

  // Selo de status (canto direito)
  const st = STATUS[match.status] || STATUS.SCHEDULED;
  const statusText = match.status === "LIVE" && match.minute ? `AO VIVO · ${match.minute}'` : st.label;
  ctx.font = `800 22px ${FONT}`;
  const pillW = ctx.measureText(statusText).width + 44;
  ctx.fillStyle = st.bg;
  roundRectPath(ctx, W - PAD - pillW, 100, pillW, 42, 21);
  ctx.fill();
  ctx.fillStyle = st.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(statusText, W - PAD - pillW / 2, 122);

  // Cartão do placar
  const cardX = PAD;
  const cardY = HEADER_H;
  const cardW = W - PAD * 2;
  roundRectPath(ctx, cardX, cardY, cardW, CARD_H, 26);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();

  const crestY = cardY + 150;
  const homeX = cardX + 190;
  const awayX = cardX + cardW - 190;
  drawCrest(ctx, match.homeTeam, homeImg, homeX, crestY, 88);
  drawCrest(ctx, match.awayTeam, awayImg, awayX, crestY, 88);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.text;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(fitText(ctx, match.homeTeam.name, 330), homeX, cardY + 275);
  ctx.fillText(fitText(ctx, match.awayTeam.name, 330), awayX, cardY + 275);

  // Placar
  ctx.font = `900 120px ${FONT}`;
  if (showScore) {
    ctx.fillStyle = C.text;
    ctx.fillText(`${match.homeScore} × ${match.awayScore}`, W / 2, crestY);
  } else {
    ctx.fillStyle = C.muted;
    ctx.fillText("×", W / 2, crestY);
  }

  // Data e local
  ctx.fillStyle = C.brand;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(formatDateTime(match.kickoff), W / 2, cardY + 338);
  if (match.venue) {
    ctx.fillStyle = C.muted;
    ctx.font = `400 25px ${FONT}`;
    ctx.fillText(fitText(ctx, match.venue, cardW - 120), W / 2, cardY + 376);
  }

  let y = cardY + CARD_H + 40;

  // Lances da partida
  if (hasEventsSection) {
    ctx.fillStyle = "rgba(34,197,94,0.16)";
    roundRectPath(ctx, PAD, y, 268, 40, 20);
    ctx.fill();
    ctx.fillStyle = C.brand;
    ctx.font = `800 21px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LANCES DA PARTIDA", PAD + 134, y + 21);
    y += 56;

    const listH = rows * ROW_H + 8;
    ctx.save();
    roundRectPath(ctx, PAD, y, cardW, listH, 22);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.clip();

    if (!events.length) {
      ctx.fillStyle = C.muted;
      ctx.font = `400 26px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Nenhum lance registrado", W / 2, y + ROW_H / 2 + 4);
    }

    events.forEach((ev, i) => {
      const rowY = y + 4 + i * ROW_H;
      const midY = rowY + ROW_H / 2;
      if (i > 0) {
        ctx.fillStyle = C.line;
        ctx.fillRect(PAD, rowY, cardW, 1);
      }

      // minuto
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundRectPath(ctx, PAD + 28, midY - 19, 84, 38, 19);
      ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.font = `700 22px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ev.minute ? `${ev.minute}'` : "—", PAD + 70, midY + 1);

      // ícone
      if (ev.kind === "goal") {
        ctx.font = `30px ${FONT}`;
        ctx.fillText("⚽", PAD + 158, midY + 2);
      } else {
        ctx.fillStyle = ev.kind === "red" ? C.red : C.yellow;
        roundRectPath(ctx, PAD + 148, midY - 15, 22, 30, 4);
        ctx.fill();
      }

      // jogador e time
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `700 27px ${FONT}`;
      ctx.fillText(fitText(ctx, ev.text, 640), PAD + 200, midY + 1);
      ctx.textAlign = "right";
      ctx.fillStyle = C.muted;
      ctx.font = `600 24px ${FONT}`;
      ctx.fillText(ev.team, W - PAD - 30, midY + 1);
    });
    ctx.restore();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    roundRectPath(ctx, PAD, y, cardW, listH, 22);
    ctx.stroke();
    y += listH + 36;
  }

  // Rodapé
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.brand;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(window.location.host, W / 2, y + 40);

  return canvas;
}

export async function buildMatchFiles(match) {
  return canvasToFiles(await renderMatchCanvas(match));
}
