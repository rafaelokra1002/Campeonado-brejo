import { ZodError } from "zod";

// Envolve controllers async para capturar erros sem try/catch repetido.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Handler central de erros.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
      details: err.errors.map((e) => ({ campo: e.path.join("."), msg: e.message })),
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado (valor único já existe)." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado." });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
}
