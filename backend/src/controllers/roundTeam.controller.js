import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";

const include = {
  picks: {
    include: {
      player: {
        select: {
          id: true,
          name: true,
          number: true,
          position: true,
          photo: true,
          team: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
        },
      },
    },
  },
};

const PHASE_ORDER = { GROUP: 0, QUARTER: 1, SEMI: 2, FINAL: 3 };

// Mais recente primeiro: fases finais antes, e dentro da fase a maior rodada.
export const list = asyncHandler(async (_req, res) => {
  const rows = await prisma.roundTeam.findMany({ include });
  rows.sort(
    (a, b) => (PHASE_ORDER[b.phase] ?? 0) - (PHASE_ORDER[a.phase] ?? 0) || b.round - a.round
  );
  res.json(rows.filter((r) => r.picks.length > 0));
});

const saveSchema = z
  .object({
    phase: z.enum(["GROUP", "QUARTER", "SEMI", "FINAL"]).default("GROUP"),
    round: z.coerce.number().int().min(1),
    picks: z
      .array(z.object({ playerId: z.string().min(1), isMvp: z.boolean().optional() }))
      .max(11, "A seleção tem no máximo 11 jogadores."),
  })
  .refine((d) => new Set(d.picks.map((p) => p.playerId)).size === d.picks.length, {
    message: "Tem jogador repetido na seleção.",
  })
  .refine((d) => d.picks.filter((p) => p.isMvp).length <= 1, {
    message: "Só pode ter um craque da rodada.",
  });

// Cria ou substitui a seleção de uma rodada/fase.
export const save = asyncHandler(async (req, res) => {
  const { phase, round, picks } = saveSchema.parse(req.body);

  const saved = await prisma.$transaction(async (tx) => {
    const roundTeam = await tx.roundTeam.upsert({
      where: { phase_round: { phase, round } },
      update: {},
      create: { phase, round },
    });
    await tx.roundTeamPick.deleteMany({ where: { roundTeamId: roundTeam.id } });
    if (picks.length) {
      await tx.roundTeamPick.createMany({
        data: picks.map((p) => ({ roundTeamId: roundTeam.id, playerId: p.playerId, isMvp: !!p.isMvp })),
      });
    }
    return tx.roundTeam.findUnique({ where: { id: roundTeam.id }, include });
  });

  res.json(saved);
});

export const remove = asyncHandler(async (req, res) => {
  await prisma.roundTeam.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
