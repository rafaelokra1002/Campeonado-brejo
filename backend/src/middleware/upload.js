import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// Escudos enviados pelo admin ficam em backend/uploads/crests/
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "crests");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error("Formato de imagem não suportado. Use PNG, JPG, WEBP, SVG ou GIF."));
    }
    cb(null, true);
  },
}).single("file");

// Envolve o multer para responder 400 (erro do cliente) em vez de cair no handler genérico de 500.
export function uploadCrest(req, res, next) {
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Imagem muito grande (máximo 3MB)." : err.message;
      return res.status(400).json({ error: msg });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}
