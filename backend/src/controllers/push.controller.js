import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { pushPublicKey } from "../lib/push.js";
import { asyncHandler } from "../middleware/error.js";

export const publicKey = asyncHandler(async (_req, res) => {
  res.json({ publicKey: pushPublicKey() });
});

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(300), auth: z.string().min(1).max(100) }),
});

export const subscribe = asyncHandler(async (req, res) => {
  if (!pushPublicKey()) return res.status(503).json({ error: "Notificações não estão ativas no servidor." });
  const { endpoint, keys } = subscribeSchema.parse(req.body);
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
  res.status(201).json({ ok: true });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = z.object({ endpoint: z.string().min(1) }).parse(req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  res.status(204).end();
});
