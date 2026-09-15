import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { teamStats } from "../services/stats.service.js";

const teamSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().min(2).max(5),
  crest: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  founded: z.coerce.number().int().optional().nullable(),
  color: z.string().optional(),
  group: z.enum(["A", "B"]).optional(),
});

export const list = asyncHandler(async (_req, res) => {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });
  res.json(teams);
});

export const getOne = asyncHandler(async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: { players: { orderBy: { number: "asc" } } },
  });
  if (!team) return res.status(404).json({ error: "Time não encontrado." });

  const stats = await teamStats(team.id);

  // Últimos e próximos jogos do time
  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
    include: {
      homeTeam: { select: { id: true, shortName: true, crest: true } },
      awayTeam: { select: { id: true, shortName: true, crest: true } },
    },
    orderBy: { kickoff: "asc" },
  });

  res.json({ ...team, stats, matches });
});

export const create = asyncHandler(async (req, res) => {
  const data = teamSchema.parse(req.body);
  const team = await prisma.team.create({ data });
  res.status(201).json(team);
});

export const update = asyncHandler(async (req, res) => {
  const data = teamSchema.partial().parse(req.body);
  const team = await prisma.team.update({ where: { id: req.params.id }, data });
  res.json(team);
});

export const remove = asyncHandler(async (req, res) => {
  await prisma.team.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
