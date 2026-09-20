import {
  C,
  FONT,
  ensureFonts,
  loadImage,
  loadCrestImage,
  roundRectPath,
  fitText,
  drawCrest,
  formatToday,
  canvasToFiles,
} from "./canvasShare.js";
import { teamFirstName } from "./format.js";

// Imagem (PNG) e PDF dos rankings de artilharia e de cartões.

const W = 1200;
const PAD = 48;
const SCALE = 2;
const HEADER_H = 190;
const ROW_H = 78;
const MAX_ROWS = 20;
const MEDALS = ["#facc15", "#cbd5e1", "#d97706"]; // ouro, prata, bronze

async function renderRanking({ subtitle, rows, drawRight }) {
  await ensureFonts();

  const shown = rows.slice(0, MAX_ROWS);
  const teams = new Map(shown.map((r) => [r.team.id, r.team]));
  const teamIds = [...teams.keys()];
  const [logo, ...crestImgs] = await Promise.all([
    loadImage("/logo-192.png"),
    ...teamIds.map((id) => loadCrestImage(teams.get(id).crest)),
  ]);
  const imgByTeam = new Map(teamIds.map((id, i) => [id, crestImgs[i]]));

  const cardH = shown.length * ROW_H + 8;
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
  ctx.fillText(subtitle, textX, 130);
  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText(`Atualizado em ${formatToday()}`, W - PAD, 130);

  // Lista
  const cardX = PAD;
  const cardY = HEADER_H;
  const cardW = W - PAD * 2;
  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.clip();

  shown.forEach((row, i) => {
    const rowY = cardY + 4 + i * ROW_H;
    const midY = rowY + ROW_H / 2;

    if (i === 0) {
      ctx.fillStyle = "rgba(34,197,94,0.10)";
      ctx.fillRect(cardX, rowY, cardW, ROW_H);
    } else {
      ctx.fillStyle = C.line;
      ctx.fillRect(cardX, rowY, cardW, 1);
    }

    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = MEDALS[i] || C.muted;
    ctx.font = `900 28px ${FONT}`;
    ctx.fillText(String(row.rank), cardX + 46, midY + 1);

    drawCrest(ctx, row.team, imgByTeam.get(row.team.id), cardX + 122, midY, 27);

    ctx.textAlign = "left";
    ctx.fillStyle = C.text;
    ctx.font = `800 28px ${FONT}`;
    ctx.fillText(fitText(ctx, row.name, 520), cardX + 172, midY - 11);
    ctx.fillStyle = C.muted;
    ctx.font = `600 21px ${FONT}`;
    ctx.fillText(teamFirstName(row.team.name), cardX + 172, midY + 20);

    drawRight(ctx, row, cardX + cardW, midY);
  });
  ctx.restore();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.stroke();

  // Rodapé
  const footY = cardY + cardH + 40;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (rows.length > MAX_ROWS) {
    ctx.fillStyle = C.muted;
    ctx.font = `400 21px ${FONT}`;
    ctx.fillText(`Top ${MAX_ROWS} de ${rows.length} jogadores`, W / 2, footY);
  }
  ctx.fillStyle = C.brand;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(window.location.host, W / 2, footY + 44);

  return canvas;
}

function drawGoalsRight(ctx, row, rightX, midY) {
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(row.goals === 1 ? "GOL" : "GOLS", rightX - 34, midY + 6);
  ctx.fillStyle = C.brand;
  ctx.font = `900 44px ${FONT}`;
  ctx.fillText(String(row.goals), rightX - 34 - 78, midY);
  if (row.penalties > 0) {
    ctx.fillStyle = C.muted;
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(`${row.penalties} pên.`, rightX - 190, midY + 2);
  }
}

function drawCardsRight(ctx, row, rightX, midY) {
  const group = (rectRight, color, count) => {
    ctx.fillStyle = count > 0 ? color : "rgba(255,255,255,0.12)";
    roundRectPath(ctx, rectRight - 96, midY - 17, 24, 34, 4);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = count > 0 ? C.text : C.muted;
    ctx.font = `900 34px ${FONT}`;
    ctx.fillText(String(count), rectRight - 60, midY + 1);
  };
  group(rightX - 30, C.red, row.red);
  group(rightX - 190, C.yellow, row.yellow);
}

export async function buildScorersFiles(scorers) {
  const canvas = await renderRanking({ subtitle: "ARTILHARIA · 2026", rows: scorers, drawRight: drawGoalsRight });
  return canvasToFiles(canvas);
}

export async function buildCardsFiles(cardsRanking) {
  const canvas = await renderRanking({ subtitle: "CARTÕES · 2026", rows: cardsRanking, drawRight: drawCardsRight });
  return canvasToFiles(canvas);
}
