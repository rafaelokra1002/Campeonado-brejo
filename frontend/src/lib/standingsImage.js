import { resolveCrestUrl } from "../api/client.js";

// Gera a imagem (PNG) e o PDF da classificação direto no navegador, desenhando
// num canvas. Não depende de bibliotecas externas.

const W = 1200;
const PAD = 48;
const SCALE = 2;
const HEADER_H = 190;
const ROW_H = 68;
const HEAD_ROW_H = 56;

const C = {
  bg: "#0a0f1a",
  card: "#0d1424",
  head: "#131c30",
  line: "rgba(255,255,255,0.07)",
  text: "#f1f5f9",
  muted: "#94a3b8",
  brand: "#4ade80",
  green: "#22c55e",
  red: "#ef4444",
};

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

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 7000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

function isImageCrest(crest) {
  return !!crest && (/^https?:\/\//.test(crest) || crest.startsWith("/"));
}

// O parâmetro evita reaproveitar do cache do navegador uma resposta carregada
// sem CORS (o que "suja" o canvas e impede exportar a imagem).
function crestImage(row) {
  if (!isImageCrest(row.crest)) return Promise.resolve(null);
  const url = resolveCrestUrl(row.crest);
  return loadImage(`${url}${url.includes("?") ? "&" : "?"}cors=1`);
}

// Espera a fonte carregar, mas no máximo 2,5s (com internet lenta segue com a
// fonte do sistema em vez de travar o botão).
async function ensureFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`900 40px Inter`),
        document.fonts.load(`700 26px Inter`),
        document.fonts.load(`400 22px Inter`),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // segue com a fonte de sistema
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function drawCrest(ctx, row, img, cx, cy, r) {
  const color = row.color || C.green;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = `${color}33`;
  ctx.fill();
  ctx.clip();
  if (img) {
    // cover
    const s = Math.max((r * 2) / img.width, (r * 2) / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else if (row.crest && !isImageCrest(row.crest)) {
    ctx.font = `${r * 1.1}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.text;
    ctx.fillText(row.crest, cx, cy + 2);
  } else {
    ctx.font = `800 ${r * 0.85}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText((row.shortName || row.name || "?").slice(0, 2).toUpperCase(), cx, cy + 1);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = `${color}88`;
  ctx.stroke();
}

function formatToday() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function renderStandingsCanvas(standingsByGroup) {
  await ensureFonts();

  const groups = Object.keys(standingsByGroup).sort();
  const allRows = groups.flatMap((g) => standingsByGroup[g]);
  const [logo, ...crestImgs] = await Promise.all([loadImage("/logo-192.png"), ...allRows.map(crestImage)]);
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

export function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível gerar a imagem."))), type, quality);
  });
}

// PDF de uma página só, com a imagem (JPEG) ocupando a página inteira.
export function buildPdfBlob(jpegBytes, imgW, imgH) {
  const pageW = 595.28;
  const pageH = Number(((pageW * imgH) / imgW).toFixed(2));
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let offset = 0;

  const push = (data) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const obj = (n, body) => {
    offsets[n] = offset;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };

  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = offset;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  push(jpegBytes);
  push("\nendstream\nendobj\n");
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xrefOffset = offset;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(`${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

// Gera tudo de uma vez: { png, pdf, width, height }
export async function buildStandingsFiles(standingsByGroup) {
  const canvas = await renderStandingsCanvas(standingsByGroup);
  const png = await canvasToBlob(canvas, "image/png");
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const pdf = buildPdfBlob(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height);
  return { png, pdf, width: canvas.width, height: canvas.height };
}
