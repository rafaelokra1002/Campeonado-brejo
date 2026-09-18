import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { computeStandings, computeStandingsByGroup, computeScorers, computeCardsRanking } from "../services/stats.service.js";

export const standings = asyncHandler(async (req, res) => {
  // ?grouped=1 retorna { A: [...], B: [...] }
  if (req.query.grouped) return res.json(await computeStandingsByGroup());
  res.json(await computeStandings());
});

export const scorers = asyncHandler(async (_req, res) => {
  res.json(await computeScorers());
});

export const cardsRanking = asyncHandler(async (_req, res) => {
  res.json(await computeCardsRanking());
});

// Dados agregados para o dashboard da home.
export const dashboard = asyncHandler(async (_req, res) => {
  const include = {
    homeTeam: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
    awayTeam: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
  };

  const [standingsByGroup, scorers, live, upcoming, recent, nextKnockoutMatch, roundsRows, totals] = await Promise.all([
    computeStandingsByGroup(),
    computeScorers(),
    prisma.match.findMany({ where: { status: "LIVE" }, include, orderBy: { kickoff: "asc" } }),
    prisma.match.findMany({
      where: { status: "SCHEDULED" },
      include,
      orderBy: { kickoff: "asc" },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: "FINISHED" },
      include,
      orderBy: { kickoff: "desc" },
      take: 5,
    }),
    prisma.match.findFirst({
      where: { status: "SCHEDULED", phase: { not: "GROUP" } },
      include,
      orderBy: { kickoff: "asc" },
    }),
    prisma.match.findMany({ distinct: ["round"], select: { round: true }, orderBy: { round: "desc" } }),
    Promise.all([prisma.team.count(), prisma.player.count(), prisma.match.count(), prisma.goal.count()]),
  ]);

  const currentRound = roundsRows.length ? roundsRows[0].round : 1;
  const [teamCount, playerCount, matchCount, goalCount] = totals;

  res.json({
    standingsByGroup,
    topScorers: scorers.slice(0, 5),
    live,
    upcoming,
    recent,
    nextKnockoutMatch,
    currentRound,
    totals: { teams: teamCount, players: playerCount, matches: matchCount, goals: goalCount },
  });
});
