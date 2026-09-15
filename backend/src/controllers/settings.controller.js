import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const ID = "main";

// Garante que a linha única de configurações sempre existe.
async function getOrCreate() {
  return prisma.settings.upsert({
    where: { id: ID },
    update: {},
    create: { id: ID },
  });
}

export const get = asyncHandler(async (_req, res) => {
  res.json(await getOrCreate());
});

const updateSchema = z.object({
  organizerName: z.string().max(80).optional(),
  bannerImage: z.string().optional().nullable(),
});

export const update = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  await getOrCreate();
  const settings = await prisma.settings.update({ where: { id: ID }, data });
  res.json(settings);
});

// Segue/deixa de seguir o campeonato. Sem cadastro de usuário no site público,
// o navegador do visitante controla localmente se já seguiu (localStorage);
// aqui só ajustamos o contador global.
export const follow = asyncHandler(async (_req, res) => {
  await getOrCreate();
  const settings = await prisma.settings.update({ where: { id: ID }, data: { followers: { increment: 1 } } });
  res.json(settings);
});

export const unfollow = asyncHandler(async (_req, res) => {
  const current = await getOrCreate();
  const settings = await prisma.settings.update({
    where: { id: ID },
    data: { followers: Math.max(0, current.followers - 1) },
  });
  res.json(settings);
});
