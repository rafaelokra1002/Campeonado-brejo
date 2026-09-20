import { prisma } from "../lib/prisma.js";

// Calcula a tabela de classificação a partir das partidas finalizadas.
export async function computeStandings() {
  const teams = await prisma.team.findMany();
  const matches = await prisma.match.findMany({
    where: { status: "FINISHED", phase: "GROUP" },
  });
  // Cartões da fase de grupos (usados como critério de desempate).
  const cards = await prisma.card.findMany({
    where: { match: { status: "FINISHED", phase: "GROUP" } },
    select: { teamId: true, type: true },
  });

  const table = new Map();
  for (const t of teams) {
    table.set(t.id, {
      teamId: t.id,
      name: t.name,
      shortName: t.shortName,
      crest: t.crest,
      color: t.color,
      group: t.group,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      redCards: 0,
      yellowCards: 0,
      form: [], // últimos resultados: V/E/D
    });
  }

  for (const c of cards) {
    const row = table.get(c.teamId);
    if (!row) continue;
    if (c.type === "RED") row.redCards++;
    else row.yellowCards++;
  }

  for (const m of matches) {
    const home = table.get(m.homeTeamId);
    const away = table.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.points += 3;
      home.wins++;
      away.losses++;
      home.form.push("V");
      away.form.push("D");
    } else if (m.homeScore < m.awayScore) {
      away.points += 3;
      away.wins++;
      home.losses++;
      away.form.push("V");
      home.form.push("D");
    } else {
      home.points++;
      away.points++;
      home.draws++;
      away.draws++;
      home.form.push("E");
      away.form.push("E");
    }
  }

  const standings = [...table.values()].map((row) => ({
    ...row,
    goalDiff: row.goalsFor - row.goalsAgainst,
    form: row.form.slice(-5),
  }));

  // Ordena e numera a posição DENTRO de cada grupo.
  const groups = new Map();
  for (const row of standings) {
    if (!groups.has(row.group)) groups.set(row.group, []);
    groups.get(row.group).push(row);
  }

  const result = [];
  for (const key of [...groups.keys()].sort()) {
    const rows = sortByTiebreak(groups.get(key), matches).map((row, i) => ({ ...row, position: i + 1 }));
    result.push(...rows);
  }
  return result;
}

// Critérios de desempate do regulamento, nesta ordem:
// pontos > vitórias > saldo de gols > gols marcados > confronto direto >
// menos cartões vermelhos > menos cartões amarelos > (sorteio, que é manual:
// aqui cai na ordem alfabética só pra ficar estável).
function sortByTiebreak(rows, matches) {
  const main = (a, b) =>
    b.points - a.points || b.wins - a.wins || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor;

  const sorted = [...rows].sort(main);
  const result = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1;
    while (j < sorted.length && main(sorted[i], sorted[j]) === 0) j++;
    const tied = sorted.slice(i, j);
    result.push(...(tied.length > 1 ? breakTie(tied, matches) : tied));
    i = j;
  }
  return result;
}

// Desempate entre times empatados nos critérios principais: mini-tabela só com
// os jogos entre eles (confronto direto), depois cartões.
function breakTie(tied, matches) {
  const ids = new Set(tied.map((t) => t.teamId));
  const mini = new Map(tied.map((t) => [t.teamId, { points: 0, gd: 0, gf: 0 }]));

  for (const m of matches) {
    if (!ids.has(m.homeTeamId) || !ids.has(m.awayTeamId)) continue;
    const home = mini.get(m.homeTeamId);
    const away = mini.get(m.awayTeamId);
    home.gf += m.homeScore;
    home.gd += m.homeScore - m.awayScore;
    away.gf += m.awayScore;
    away.gd += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) home.points += 3;
    else if (m.homeScore < m.awayScore) away.points += 3;
    else {
      home.points++;
      away.points++;
    }
  }

  return [...tied].sort((a, b) => {
    const ma = mini.get(a.teamId);
    const mb = mini.get(b.teamId);
    return (
      mb.points - ma.points ||
      mb.gd - ma.gd ||
      mb.gf - ma.gf ||
      a.redCards - b.redCards ||
      a.yellowCards - b.yellowCards ||
      a.name.localeCompare(b.name)
    );
  });
}

// Classificação agrupada: { A: [...], B: [...] }
export async function computeStandingsByGroup() {
  const flat = await computeStandings();
  const grouped = {};
  for (const row of flat) {
    (grouped[row.group] ||= []).push(row);
  }
  return grouped;
}

// Ranking de artilheiros (gols que não são contra).
export async function computeScorers() {
  const goals = await prisma.goal.findMany({
    where: { ownGoal: false, playerId: { not: null } },
    include: {
      player: true,
      team: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
    },
  });

  const map = new Map();
  for (const g of goals) {
    if (!g.player) continue;
    const key = g.playerId;
    if (!map.has(key)) {
      map.set(key, {
        playerId: g.playerId,
        name: g.player.name,
        number: g.player.number,
        team: g.team,
        goals: 0,
        penalties: 0,
      });
    }
    const entry = map.get(key);
    entry.goals++;
    if (g.penalty) entry.penalties++;
  }

  return [...map.values()]
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// Ranking de cartões (amarelo + vermelho) por jogador.
export async function computeCardsRanking() {
  const cards = await prisma.card.findMany({
    where: { playerId: { not: null } },
    include: {
      player: true,
      team: { select: { id: true, name: true, shortName: true, crest: true, color: true } },
    },
  });

  const map = new Map();
  for (const c of cards) {
    if (!c.player) continue;
    const key = c.playerId;
    if (!map.has(key)) {
      map.set(key, {
        playerId: c.playerId,
        name: c.player.name,
        number: c.player.number,
        team: c.team,
        yellow: 0,
        red: 0,
      });
    }
    const entry = map.get(key);
    if (c.type === "RED") entry.red++;
    else entry.yellow++;
  }

  return [...map.values()]
    .map((row) => ({ ...row, total: row.yellow + row.red }))
    .sort((a, b) => b.total - a.total || b.red - a.red || a.name.localeCompare(b.name))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// Estatísticas agregadas de um time.
export async function teamStats(teamId) {
  const standings = await computeStandings();
  const row = standings.find((s) => s.teamId === teamId);
  return row || null;
}
