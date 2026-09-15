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
