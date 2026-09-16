import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const playerSchema = z.object({
  name: z.string().min(2),
  number: z.coerce.number().int().optional().nullable(),
  position: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  teamId: z.string().min(1),
});

export const list = asyncHandler(async (req, res) => {
  const { teamId } = req.query;
  const players = await prisma.player.findMany({
    where: teamId ? { teamId: String(teamId) } : undefined,
    include: { team: { select: { id: true, shortName: true, crest: true, color: true } } },
    orderBy: [{ team: { name: "asc" } }, { number: "asc" }],
  });
  res.json(players);
});

export const getOne = asyncHandler(async (req, res) => {
  const player = await prisma.player.findUnique({
    where: { id: req.params.id },
    include: { team: { select: { id: true, name: true, shortName: true, crest: true, color: true } } },
  });
  if (!player) return res.status(404).json({ error: "Jogador não encontrado." });

  const [goals, cards] = await Promise.all([
    prisma.goal.findMany({ where: { playerId: player.id } }),
    prisma.card.findMany({ where: { playerId: player.id } }),
  ]);

  const stats = {
    goals: goals.filter((g) => !g.ownGoal).length,
    ownGoals: goals.filter((g) => g.ownGoal).length,
    penalties: goals.filter((g) => g.penalty).length,
    yellow: cards.filter((c) => c.type === "YELLOW").length,
    red: cards.filter((c) => c.type === "RED").length,
  };

  res.json({ ...player, stats });
});

export const create = asyncHandler(async (req, res) => {
  const data = playerSchema.parse(req.body);
  const player = await prisma.player.create({ data });
  res.status(201).json(player);
});

export const update = asyncHandler(async (req, res) => {
  const data = playerSchema.partial().parse(req.body);
  const player = await prisma.player.update({ where: { id: req.params.id }, data });
  res.json(player);
});

export const remove = asyncHandler(async (req, res) => {
  await prisma.player.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
