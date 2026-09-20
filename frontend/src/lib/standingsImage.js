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

// Imagem (PNG) e PDF da classificação, desenhados num canvas.

const W = 1200;
const PAD = 48;
const SCALE = 2;
const HEADER_H = 190;
const ROW_H = 68;
const HEAD_ROW_H = 56;

// [rótulo, centro x, chave]
const COLS = [
  ["P", 630, "points"],
  ["J", 700, "played"],
  ["V", 765, "wins"],
  ["E", 830, "draws"],
  ["D", 895, "losses"],
  ["GP", 965, "goalsFor"],
  ["GC", 1035, "goalsAgainst"],
  ["SG", 1110, "goalDiff"],
];

export async function renderStandingsCanvas(standingsByGroup) {
  await ensureFonts();

  const groups = Object.keys(standingsByGroup).sort();
  const allRows = groups.flatMap((g) => standingsByGroup[g]);
  const [logo, ...crestImgs] = await Promise.all([loadImage("/logo-192.png"), ...allRows.map((r) => loadCrestImage(r.crest))]);
  const imgByTeam = new Map(allRows.map((row, i) => [row.teamId, crestImgs[i]]));

  const groupsH = groups.reduce(
    (sum, g) => sum + 56 + HEAD_ROW_H + standingsByGroup[g].length * ROW_H + 8 + 36,
    0
  );
  const H = HEADER_H + groupsH + 110;

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
  ctx.fillText("CLASSIFICAÇÃO · 2026", textX, 130);
  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText(`Atualizado em ${formatToday()}`, W - PAD, 130);

  // Grupos
  let y = HEADER_H;
  for (const g of groups) {
    const rows = standingsByGroup[g];
    const total = rows.length;

    // Selo do grupo
    ctx.fillStyle = "rgba(34,197,94,0.16)";
    roundRectPath(ctx, PAD, y, 168, 40, 20);
    ctx.fill();
    ctx.fillStyle = C.brand;
    ctx.font = `800 21px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`GRUPO ${g}`, PAD + 84, y + 21);
    y += 56;

    // Cartão da tabela
    const cardH = HEAD_ROW_H + rows.length * ROW_H + 8;
    const cardW = W - PAD * 2;
    ctx.save();
    roundRectPath(ctx, PAD, y, cardW, cardH, 22);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.clip();

    // Linha de títulos
    ctx.fillStyle = C.head;
    ctx.fillRect(PAD, y, cardW, HEAD_ROW_H);
    ctx.fillStyle = C.muted;
    ctx.font = `700 19px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("#", PAD + 46, y + HEAD_ROW_H / 2);
    ctx.textAlign = "left";
    ctx.fillText("TIME", 205, y + HEAD_ROW_H / 2);
    ctx.textAlign = "center";
    for (const [label, cx, key] of COLS) {
      ctx.fillStyle = key === "points" ? C.brand : C.muted;
      ctx.fillText(label, cx, y + HEAD_ROW_H / 2);
    }

    // Linhas
    rows.forEach((row, i) => {
      const rowY = y + HEAD_ROW_H + i * ROW_H;
      const midY = rowY + ROW_H / 2;

      ctx.fillStyle = C.line;
      ctx.fillRect(PAD, rowY, cardW, 1);

      const zone = row.position <= 4 ? C.green : row.position === total ? C.red : null;
      if (zone) {
        ctx.fillStyle = zone;
        ctx.fillRect(PAD, rowY, 7, ROW_H);
      }

      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = C.muted;
      ctx.font = `700 24px ${FONT}`;
      ctx.fillText(String(row.position), PAD + 46, midY + 1);

      drawCrest(ctx, row, imgByTeam.get(row.teamId), 160, midY, 25);

      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `800 25px ${FONT}`;
      ctx.fillText(fitText(ctx, row.name, 380), 205, midY + 1);

      ctx.textAlign = "center";
      for (const [, cx, key] of COLS) {
        const value = row[key];
        const isPoints = key === "points";
        ctx.font = `${isPoints ? 900 : 700} 25px ${FONT}`;
        ctx.fillStyle = isPoints ? C.brand : key === "played" ? C.muted : C.text;
        const shown = key === "goalDiff" && value > 0 ? `+${value}` : String(value);
        ctx.fillText(shown, cx, midY + 1);
      }
    });
    ctx.restore();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    roundRectPath(ctx, PAD, y, cardW, cardH, 22);
    ctx.stroke();

    y += cardH + 36;
  }

  // Legenda e rodapé
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `400 21px ${FONT}`;
  ctx.fillStyle = C.green;
  roundRectPath(ctx, PAD, y + 4, 22, 22, 6);
  ctx.fill();
  ctx.fillStyle = C.muted;
  ctx.fillText("Zona de classificação", PAD + 34, y + 16);
  ctx.fillStyle = C.red;
  roundRectPath(ctx, PAD + 300, y + 4, 22, 22, 6);
  ctx.fill();
  ctx.fillStyle = C.muted;
  ctx.fillText("Zona de rebaixamento", PAD + 334, y + 16);

  ctx.textAlign = "center";
  ctx.fillStyle = C.brand;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(window.location.host, W / 2, y + 68);

  return canvas;
}

// Gera tudo de uma vez: { png, pdf, width, height }
export async function buildStandingsFiles(standingsByGroup) {
  return canvasToFiles(await renderStandingsCanvas(standingsByGroup));
}
