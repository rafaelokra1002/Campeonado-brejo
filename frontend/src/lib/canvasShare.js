import { resolveCrestUrl } from "../api/client.js";

// Peças comuns para gerar imagem (PNG) e PDF de compartilhamento desenhando
// num canvas: fontes, escudos, formas e montagem do PDF. Sem bibliotecas.

export const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export const C = {
  bg: "#0a0f1a",
  card: "#0d1424",
  head: "#131c30",
  line: "rgba(255,255,255,0.07)",
  text: "#f1f5f9",
  muted: "#94a3b8",
  brand: "#4ade80",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#facc15",
};

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 7000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

export function isImageCrest(crest) {
  return !!crest && (/^https?:\/\//.test(crest) || crest.startsWith("/"));
}

// O parâmetro evita reaproveitar do cache do navegador uma resposta carregada
// sem CORS (o que "suja" o canvas e impede exportar a imagem).
export function loadCrestImage(crest) {
  if (!isImageCrest(crest)) return Promise.resolve(null);
  const url = resolveCrestUrl(crest);
  return loadImage(`${url}${url.includes("?") ? "&" : "?"}cors=1`);
}

// Espera a fonte carregar, mas no máximo 2,5s (com internet lenta segue com a
// fonte do sistema em vez de travar o botão).
export async function ensureFonts() {
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

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

// Escudo redondo: imagem (cover), emoji ou as 2 primeiras letras como reserva.
export function drawCrest(ctx, team, img, cx, cy, r) {
  const color = team.color || C.green;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = `${color}33`;
  ctx.fill();
  ctx.clip();
  if (img) {
    const s = Math.max((r * 2) / img.width, (r * 2) / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else if (team.crest && !isImageCrest(team.crest)) {
    ctx.font = `${r * 1.1}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.text;
    ctx.fillText(team.crest, cx, cy + 2);
  } else {
    ctx.font = `800 ${r * 0.85}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText((team.shortName || team.name || "?").slice(0, 2).toUpperCase(), cx, cy + 1);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = `${color}88`;
  ctx.stroke();
}

export function formatToday() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
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

// Do canvas pronto para { png, pdf, width, height }.
export async function canvasToFiles(canvas) {
  const png = await canvasToBlob(canvas, "image/png");
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const pdf = buildPdfBlob(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height);
  return { png, pdf, width: canvas.width, height: canvas.height };
}
