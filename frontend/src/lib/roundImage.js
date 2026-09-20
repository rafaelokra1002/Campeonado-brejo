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
import { formatDateTime } from "./format.js";

// Imagem (PNG) e PDF de uma rodada (ou fase do mata-mata): todos os jogos.

const W = 1200;
const PAD = 48;
const SCALE = 2;
const HEADER_H = 190;
const ROW_H = 130;

// title: "RODADA 3", "QUARTAS DE FINAL"...; subtitle opcional.
export async function renderRoundCanvas({ title, subtitle, matches }) {
  await ensureFonts();

  const teams = new Map();
  for (const m of matches) {
    teams.set(m.homeTeam.id, m.homeTeam);
    teams.set(m.awayTeam.id, m.awayTeam);
  }
  const teamIds = [...teams.keys()];
  const [logo, ...crestImgs] = await Promise.all([
    loadImage("/logo-192.png"),
    ...teamIds.map((id) => loadCrestImage(teams.get(id).crest)),
  ]);
  const imgByTeam = new Map(teamIds.map((id, i) => [id, crestImgs[i]]));

  const cardH = matches.length * ROW_H + 8;
  const H = HEADER_H + cardH + 130;

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
  ctx.fillText(title.toUpperCase(), textX, 130);
  if (subtitle) {
    ctx.textAlign = "right";
    ctx.fillStyle = C.muted;
    ctx.font = `400 22px ${FONT}`;
    ctx.fillText(subtitle, W - PAD, 130);
  }

  // Lista de jogos
  const cardX = PAD;
  const cardY = HEADER_H;
  const cardW = W - PAD * 2;
  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.clip();

  const cx = W / 2;
  matches.forEach((m, i) => {
    const rowY = cardY + 4 + i * ROW_H;
    const midY = rowY + 54;
    const showScore = m.status !== "SCHEDULED";

    if (i > 0) {
      ctx.fillStyle = C.line;
      ctx.fillRect(cardX, rowY, cardW, 1);
    }

    // escudos
    drawCrest(ctx, m.homeTeam, imgByTeam.get(m.homeTeam.id), cx - 190, midY, 36);
    drawCrest(ctx, m.awayTeam, imgByTeam.get(m.awayTeam.id), cx + 190, midY, 36);

    // nomes
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.text;
    ctx.font = `800 29px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(fitText(ctx, m.homeTeam.name, 290), cx - 190 - 36 - 18, midY + 1);
    ctx.textAlign = "left";
    ctx.fillText(fitText(ctx, m.awayTeam.name, 290), cx + 190 + 36 + 18, midY + 1);

    // placar
    ctx.textAlign = "center";
    ctx.font = `900 54px ${FONT}`;
    if (showScore) {
      ctx.fillStyle = C.text;
      ctx.fillText(`${m.homeScore} × ${m.awayScore}`, cx, midY + 2);
    } else {
      ctx.fillStyle = C.muted;
      ctx.fillText("×", cx, midY + 2);
    }

    // data/hora e status
    const live = m.status === "LIVE";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = live ? C.red : C.muted;
    const info = `${formatDateTime(m.kickoff)}${live ? `  ·  AO VIVO${m.minute ? ` ${m.minute}'` : ""}` : ""}`;
    ctx.fillText(info, cx, rowY + 112);
  });
  ctx.restore();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.stroke();

  // Rodapé
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.brand;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(window.location.host, W / 2, cardY + cardH + 60);

  return canvas;
}

export async function buildRoundFiles(args) {
  return canvasToFiles(await renderRoundCanvas(args));
}
