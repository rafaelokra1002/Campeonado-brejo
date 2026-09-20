import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

// Bolão de palpites: o participante escolhe um apelido (sem cadastro) e
// recebe uma chave secreta que fica guardada no aparelho dele.

const registerSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "O apelido precisa ter pelo menos 2 letras.")
    .max(20, "O apelido pode ter no máximo 20 caracteres.")
    .regex(/^[\p{L}\p{N} ._-]+$/u, "Use só letras, números, espaço, ponto, hífen ou underline."),
});

export const register = asyncHandler(async (req, res) => {
  const { nickname } = registerSchema.parse(req.body);
  const nicknameKey = nickname.toLowerCase();

  if (await prisma.predictor.findUnique({ where: { nicknameKey } })) {
    return res.status(409).json({ error: "Esse apelido já está em uso. Escolha outro." });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const predictor = await prisma.predictor.create({ data: { nickname, nicknameKey, token } });
  res.status(201).json({ id: predictor.id, nickname: predictor.nickname, token });
});

const outcome = (m) => (m.homeScore > m.awayScore ? "HOME" : m.homeScore < m.awayScore ? "AWAY" : "DRAW");

// Ranking: 1 ponto por resultado acertado (vitória de quem/empate), só em jogos encerrados.
export const ranking = asyncHandler(async (_req, res) => {
  const predictions = await prisma.prediction.findMany({
    include: {
      predictor: { select: { id: true, nickname: true } },
      match: { select: { status: true, homeScore: true, awayScore: true } },
    },
  });

  const table = new Map();
  for (const p of predictions) {
    if (!table.has(p.predictorId)) {
      table.set(p.predictorId, { predictorId: p.predictorId, nickname: p.predictor.nickname, hits: 0, played: 0, pending: 0 });
    }
    const row = table.get(p.predictorId);
    if (p.match.status !== "FINISHED") {
      row.pending++;
      continue;
    }
    row.played++;
    if (p.choice === outcome(p.match)) row.hits++;
  }

  const rows = [...table.values()]
    .sort((a, b) => b.hits - a.hits || a.played - b.played || a.nickname.localeCompare(b.nickname))
    .map((row, i) => ({ ...row, rank: i + 1 }));

  res.json(rows);
});
