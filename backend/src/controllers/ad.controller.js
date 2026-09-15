import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const adSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional().nullable(),
  slot: z.string().min(1).default("home-top"),
  active: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

// Público: só os anúncios ativos do slot pedido, na ordem configurada.
export const list = asyncHandler(async (req, res) => {
  const { slot } = req.query;
  const ads = await prisma.ad.findMany({
    where: { active: true, ...(slot ? { slot: String(slot) } : {}) },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  res.json(ads);
});

// Admin: todos os anúncios (ativos e inativos), para gerenciar.
export const listAll = asyncHandler(async (_req, res) => {
  const ads = await prisma.ad.findMany({ orderBy: [{ slot: "asc" }, { order: "asc" }] });
  res.json(ads);
});

export const create = asyncHandler(async (req, res) => {
  const data = adSchema.parse(req.body);
  const ad = await prisma.ad.create({ data });
  res.status(201).json(ad);
});

export const update = asyncHandler(async (req, res) => {
  const data = adSchema.partial().parse(req.body);
  const ad = await prisma.ad.update({ where: { id: req.params.id }, data });
  res.json(ad);
});

export const remove = asyncHandler(async (req, res) => {
  await prisma.ad.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
