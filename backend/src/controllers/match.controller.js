import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const matchInclude = {
  homeTeam: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
  awayTeam: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
};

const detailInclude = {
  ...matchInclude,
  goals: {
    include: { player: { select: { id: true, name: true, number: true } }, team: { select: { id: true, shortName: true } } },
    orderBy: { minute: "asc" },
  },
  cards: {
    include: { player: { select: { id: true, name: true, number: true } }, team: { select: { id: true, shortName: true } } },
    orderBy: { minute: "asc" },
  },
};

const matchSchema = z.object({
  round: z.coerce.number().int().min(1),
  phase: z.enum(["GROUP", "QUARTER", "SEMI", "FINAL"]).optional(),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED"]).optional(),
  kickoff: z.coerce.date(),
  venue: z.string().optional().nullable(),
  minute: z.coerce.number().int().optional().nullable(),
});

export const list = asyncHandler(async (req, res) => {
  const { round, status, teamId, phase } = req.query;
  const where = {};
  if (round) where.round = Number(round);
  if (status) where.status = String(status);
  if (phase) where.phase = String(phase);
  if (teamId) where.OR = [{ homeTeamId: String(teamId) }, { awayTeamId: String(teamId) }];

  const matches = await prisma.match.findMany({
    where,
    include: matchInclude,
    orderBy: [{ round: "asc" }, { kickoff: "asc" }],
  });
  res.json(matches);
});

// Rodadas existentes na fase de grupos (para o filtro). O mata-mata não tem
// "rodada" de verdade, então fica de fora dessa lista.
export const rounds = asyncHandler(async (_req, res) => {
  const rows = await prisma.match.findMany({
    where: { phase: "GROUP" },
    distinct: ["round"],
    select: { round: true },
    orderBy: { round: "asc" },
  });
  res.json(rows.map((r) => r.round));
});

export const getOne = asyncHandler(async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: detailInclude,
  });
  if (!match) return res.status(404).json({ error: "Partida não encontrada." });

  // Confronto direto: últimos jogos entre esses dois times, em qualquer ordem de mando.
  const headToHead = await prisma.match.findMany({
    where: {
      id: { not: match.id },
      status: "FINISHED",
      OR: [
        { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
        { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
      ],
    },
    include: matchInclude,
    orderBy: { kickoff: "desc" },
    take: 5,
  });

  res.json({ ...match, headToHead });
});

export const create = asyncHandler(async (req, res) => {
  const data = matchSchema.parse(req.body);
  if (data.homeTeamId === data.awayTeamId) {
    return res.status(400).json({ error: "Um time não pode jogar contra si mesmo." });
  }
  const match = await prisma.match.create({ data, include: matchInclude });
  res.status(201).json(match);
});

export const update = asyncHandler(async (req, res) => {
  const data = matchSchema.partial().parse(req.body);
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data,
    include: matchInclude,
  });
  res.json(match);
});

export const remove = asyncHandler(async (req, res) => {
  await prisma.match.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Atualização rápida de placar/status/minuto (para o "ao vivo").
const scoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED"]).optional(),
  minute: z.coerce.number().int().optional().nullable(),
});

export const updateScore = asyncHandler(async (req, res) => {
  const data = scoreSchema.parse(req.body);
  const match = await prisma.match.update({
    where: { id: req.params.id },
    data,
    include: detailInclude,
  });
  res.json(match);
});

// ---- Enquete "quem vence" ----
const voteSchema = z.object({ choice: z.enum(["HOME", "DRAW", "AWAY"]) });

export const vote = asyncHandler(async (req, res) => {
  const { choice } = voteSchema.parse(req.body);
  const match = await prisma.match.findUnique({ where: { id: req.params.id } });
  if (!match) return res.status(404).json({ error: "Partida não encontrada." });
  if (match.status !== "SCHEDULED") {
    return res.status(400).json({ error: "A votação encerra quando a partida começa." });
  }

  const field = choice === "HOME" ? "votesHome" : choice === "AWAY" ? "votesAway" : "votesDraw";
  const updated = await prisma.match.update({
    where: { id: req.params.id },
    data: { [field]: { increment: 1 } },
    include: matchInclude,
  });
  res.json(updated);
});

// ---- Gols ----
const goalSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().optional().nullable(),
  minute: z.coerce.number().int().optional().nullable(),
  ownGoal: z.boolean().optional(),
  penalty: z.boolean().optional(),
  // se true, incrementa o placar do time automaticamente
  bumpScore: z.boolean().optional().default(true),
});

export const addGoal = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const data = goalSchema.parse(req.body);
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: "Partida não encontrada." });

  await prisma.goal.create({
    data: {
      matchId,
      teamId: data.teamId,
      playerId: data.playerId || null,
      minute: data.minute ?? null,
      ownGoal: data.ownGoal ?? false,
      penalty: data.penalty ?? false,
    },
  });

  if (data.bumpScore) {
    // Gol contra conta para o adversário.
    const beneficiary =
      data.ownGoal
        ? data.teamId === match.homeTeamId
          ? "awayScore"
          : "homeScore"
        : data.teamId === match.homeTeamId
        ? "homeScore"
        : "awayScore";
    await prisma.match.update({
      where: { id: matchId },
      data: { [beneficiary]: { increment: 1 } },
    });
  }

  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.status(201).json(updated);
});

// Edita jogador/minuto/pênalti de um gol já registrado, sem mexer no placar
// (time e "gol contra" ficam fixos, pois alterá-los mudaria o placar).
const goalEditSchema = z.object({
  playerId: z.string().optional().nullable(),
  minute: z.coerce.number().int().optional().nullable(),
  penalty: z.boolean().optional(),
});

export const updateGoal = asyncHandler(async (req, res) => {
  const { id: matchId, goalId } = req.params;
  const data = goalEditSchema.parse(req.body);
  await prisma.goal.update({ where: { id: goalId }, data });
  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.json(updated);
});

export const removeGoal = asyncHandler(async (req, res) => {
  const { id: matchId, goalId } = req.params;
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return res.status(404).json({ error: "Gol não encontrado." });
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  await prisma.goal.delete({ where: { id: goalId } });

  // Reverte o placar.
  const target = goal.ownGoal
    ? goal.teamId === match.homeTeamId
      ? "awayScore"
      : "homeScore"
    : goal.teamId === match.homeTeamId
    ? "homeScore"
    : "awayScore";
  if (match[target] > 0) {
    await prisma.match.update({ where: { id: matchId }, data: { [target]: { decrement: 1 } } });
  }

  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.json(updated);
});

// ---- Cartões ----
const cardSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().optional().nullable(),
  type: z.enum(["YELLOW", "RED"]).default("YELLOW"),
  minute: z.coerce.number().int().optional().nullable(),
});

export const addCard = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const data = cardSchema.parse(req.body);
  await prisma.card.create({ data: { matchId, ...data } });
  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.status(201).json(updated);
});

const cardEditSchema = z.object({
  playerId: z.string().optional().nullable(),
  type: z.enum(["YELLOW", "RED"]).optional(),
  minute: z.coerce.number().int().optional().nullable(),
});

export const updateCard = asyncHandler(async (req, res) => {
  const { id: matchId, cardId } = req.params;
  const data = cardEditSchema.parse(req.body);
  await prisma.card.update({ where: { id: cardId }, data });
  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.json(updated);
});

export const removeCard = asyncHandler(async (req, res) => {
  const { id: matchId, cardId } = req.params;
  await prisma.card.delete({ where: { id: cardId } });
  const updated = await prisma.match.findUnique({ where: { id: matchId }, include: detailInclude });
  res.json(updated);
});
