// Recebe uma imagem (escudo de time) e devolve a URL pública para salvar no campo `crest`.
export function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }
  res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
}
