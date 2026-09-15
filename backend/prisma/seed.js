import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POSITIONS = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"];

// Times reais do Campeonato Brejolândense 2026 (dois grupos)
const TEAMS = [
  // Grupo A
  { name: "Vila Nova", shortName: "VIL", group: "A", color: "#ef4444", crest: "⭐" },
  { name: "Brejo City", shortName: "BRC", group: "A", color: "#f59e0b", crest: "🏙️" },
  { name: "Ponta D'Água", shortName: "PDA", group: "A", color: "#3b82f6", crest: "💧" },
  { name: "Tropa", shortName: "TRO", group: "A", color: "#16a34a", crest: "🎖️" },
  { name: "Campinense", shortName: "CAM", group: "A", color: "#eab308", crest: "🐝" },
  { name: "Poço de Baixo", shortName: "POB", group: "A", color: "#64748b", crest: "🕳️" },
  // Grupo B
  { name: "Mombaça", shortName: "MOM", group: "B", color: "#2563eb", crest: "🐐" },
  { name: "União Jacaré", shortName: "UNJ", group: "B", color: "#0ea5e9", crest: "🐊" },
  { name: "Santa Paz", shortName: "SPZ", group: "B", color: "#facc15", crest: "☮️" },
  { name: "Sertãozinho", shortName: "SER", group: "B", color: "#f97316", crest: "🦅" },
  { name: "Serrolândia", shortName: "SRL", group: "B", color: "#dc2626", crest: "🏔️" },
  { name: "Panelinha", shortName: "PAN", group: "B", color: "#a855f7", crest: "🍲" },
];

// Calendário e placares que reproduzem EXATAMENTE a tabela divulgada da 1ª fase
// (round-robin simples de 6 times por grupo = 5 rodadas). Rodadas 1 e parte da
// rodada 2 já disputadas; o restante está agendado com data/hora reais.
const MATCHES = [
  // ---- Rodada 1 (05/09) ----
  { round: 1, home: "Tropa", away: "Campinense", hs: 1, as: 0, date: "2026-09-05", time: "17:00" },
  { round: 1, home: "Vila Nova", away: "Ponta D'Água", hs: 1, as: 0, date: "2026-09-05", time: "17:00" },
  { round: 1, home: "Brejo City", away: "Poço de Baixo", hs: 2, as: 0, date: "2026-09-05", time: "17:00" },
  { round: 1, home: "União Jacaré", away: "Sertãozinho", hs: 3, as: 1, date: "2026-09-05", time: "17:00" },
  { round: 1, home: "Panelinha", away: "Mombaça", hs: 0, as: 7, date: "2026-09-05", time: "17:00" },
  { round: 1, home: "Santa Paz", away: "Serrolândia", hs: 7, as: 2, date: "2026-09-05", time: "17:00" },

  // ---- Rodada 2 (Grupo A já disputado em 06/09; Grupo B agendado 12-14/09) ----
  { round: 2, home: "Vila Nova", away: "Tropa", hs: 3, as: 1, date: "2026-09-06", time: "17:00" },
  { round: 2, home: "Campinense", away: "Brejo City", hs: 1, as: 1, date: "2026-09-06", time: "17:00" },
  { round: 2, home: "Poço de Baixo", away: "Ponta D'Água", hs: 0, as: 4, date: "2026-09-06", time: "17:00" },
  { round: 2, home: "Panelinha", away: "União Jacaré", scheduled: true, date: "2026-09-12", time: "17:00" },
  { round: 2, home: "Sertãozinho", away: "Santa Paz", scheduled: true, date: "2026-09-13", time: "17:00" },
  { round: 2, home: "Serrolândia", away: "Mombaça", scheduled: true, date: "2026-09-14", time: "17:30" },

  // ---- Rodada 3 (19-28/09, agendada) ----
  { round: 3, home: "Poço de Baixo", away: "Campinense", scheduled: true, date: "2026-09-19", time: "17:00" },
  { round: 3, home: "Brejo City", away: "Vila Nova", scheduled: true, date: "2026-09-20", time: "17:00" },
  { round: 3, home: "Ponta D'Água", away: "Tropa", scheduled: true, date: "2026-09-21", time: "17:30" },
  { round: 3, home: "Serrolândia", away: "Sertãozinho", scheduled: true, date: "2026-09-26", time: "17:00" },
  { round: 3, home: "Santa Paz", away: "Panelinha", scheduled: true, date: "2026-09-27", time: "17:00" },
  { round: 3, home: "Mombaça", away: "União Jacaré", scheduled: true, date: "2026-09-28", time: "17:30" },

  // ---- Rodada 4 (10-19/10, agendada) ----
  { round: 4, home: "Vila Nova", away: "Poço de Baixo", scheduled: true, date: "2026-10-10", time: "17:00" },
  { round: 4, home: "Ponta D'Água", away: "Campinense", scheduled: true, date: "2026-10-11", time: "17:00" },
  { round: 4, home: "Tropa", away: "Brejo City", scheduled: true, date: "2026-10-12", time: "17:30" },
  { round: 4, home: "Panelinha", away: "Serrolândia", scheduled: true, date: "2026-10-17", time: "17:00" },
  { round: 4, home: "Mombaça", away: "Sertãozinho", scheduled: true, date: "2026-10-18", time: "17:00" },
  { round: 4, home: "União Jacaré", away: "Santa Paz", scheduled: true, date: "2026-10-19", time: "17:30" },

  // ---- Rodada 5 (31/10-09/11, agendada) ----
  { round: 5, home: "Ponta D'Água", away: "Brejo City", scheduled: true, date: "2026-10-31", time: "17:00" },
  { round: 5, home: "Tropa", away: "Poço de Baixo", scheduled: true, date: "2026-11-01", time: "17:00" },
  { round: 5, home: "Campinense", away: "Vila Nova", scheduled: true, date: "2026-11-02", time: "17:30" },
  { round: 5, home: "Mombaça", away: "Santa Paz", scheduled: true, date: "2026-11-07", time: "17:00" },
  { round: 5, home: "União Jacaré", away: "Serrolândia", scheduled: true, date: "2026-11-08", time: "17:00" },
  { round: 5, home: "Sertãozinho", away: "Panelinha", scheduled: true, date: "2026-11-09", time: "17:30" },
];

// Artilharia real do campeonato (gols batendo com a tabela divulgada).
const REAL_SCORERS = [
  { name: "Manelinho", team: "Mombaça", goals: 5, number: 9 },
  { name: "Arthur", team: "Mombaça", goals: 3, number: 7 },
  { name: "Jhon", team: "Ponta D'Água", goals: 3, number: 9 },
  { name: "Nem", team: "Santa Paz", goals: 3, number: 11 },
];

const FIRST_NAMES = ["João","Pedro","Lucas","Gabriel","Matheus","Rafael","Bruno","Carlos","Diego","Felipe","Rodrigo","Thiago","Vinícius","Wesley","André","Marcos","Paulo","Ricardo","Everton","Igor"];
const LAST_NAMES = ["Silva","Santos","Oliveira","Souza","Lima","Pereira","Costa","Almeida","Nascimento","Rodrigues","Ferreira","Gomes","Ribeiro","Martins","Barbosa"];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const playerName = () => `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`;

async function main() {
  console.log("🧹 Limpando banco...");
  await prisma.card.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Admin
  const email = process.env.ADMIN_EMAIL || "admin@brejolandense.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  await prisma.user.create({
    data: { email, name: "Administrador", password: await bcrypt.hash(password, 10) },
  });
  console.log(`👤 Admin: ${email} / ${password}`);

  // Times + elencos (jogadores fictícios — edite pelo painel admin)
  const byName = new Map();
  const rosterByTeam = new Map();
  for (const t of TEAMS) {
    const team = await prisma.team.create({ data: t });
    byName.set(team.name, team);
    const roster = [];
    let number = 1;
    for (let i = 0; i < 14; i++) {
      const position = i === 0 ? "Goleiro" : rnd(POSITIONS);
      roster.push(await prisma.player.create({
        data: { name: playerName(), number: number++, position, teamId: team.id },
      }));
    }
    rosterByTeam.set(team.id, roster);
  }
  console.log(`⚽ ${TEAMS.length} times criados (Grupo A e B) com elencos.`);

  // Artilheiros reais: entram no elenco do time e têm prioridade nos gols
  // até completar a meta de cada um (o restante dos gols do time fica com o elenco fictício).
  const quotaByTeam = new Map();
  for (const s of REAL_SCORERS) {
    const team = byName.get(s.team);
    if (!team) { console.warn("Time do artilheiro não encontrado:", s.team); continue; }
    const player = await prisma.player.create({
      data: { name: s.name, number: s.number, position: "Atacante", teamId: team.id },
    });
    rosterByTeam.get(team.id).push(player);
    if (!quotaByTeam.has(team.id)) quotaByTeam.set(team.id, []);
    quotaByTeam.get(team.id).push({ playerId: player.id, remaining: s.goals });
  }
  console.log(`🎯 ${REAL_SCORERS.length} artilheiros reais adicionados aos elencos.`);

  for (const m of MATCHES) {
    const home = byName.get(m.home);
    const away = byName.get(m.away);
    if (!home || !away) { console.warn("Time não encontrado:", m.home, m.away); continue; }

    const [hh, mm] = m.time.split(":").map(Number);
    const kickoff = new Date(`${m.date}T00:00:00`);
    kickoff.setHours(hh, mm, 0, 0);

    const scheduled = m.scheduled;
    const match = await prisma.match.create({
      data: {
        round: m.round,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: scheduled ? 0 : m.hs,
        awayScore: scheduled ? 0 : m.as,
        status: scheduled ? "SCHEDULED" : "FINISHED",
        kickoff,
        venue: `Estádio Municipal de ${home.name}`,
      },
    });

    if (!scheduled) {
      await addGoals(match.id, home.id, m.hs, rosterByTeam, quotaByTeam);
      await addGoals(match.id, away.id, m.as, rosterByTeam, quotaByTeam);
      // cartões ocasionais
      for (const team of [home, away]) {
        if (Math.random() < 0.5) {
          await prisma.card.create({
            data: {
              matchId: match.id,
              teamId: team.id,
              playerId: rnd(rosterByTeam.get(team.id)).id,
              type: Math.random() < 0.15 ? "RED" : "YELLOW",
              minute: Math.floor(Math.random() * 90) + 1,
            },
          });
        }
      }
    }
  }
  console.log(`📅 ${MATCHES.length} jogos criados (rodada 1 e parte da rodada 2 finalizadas, restante agendado).`);
  console.log("✅ Seed concluído! Tabela reproduz a imagem do campeonato.");
}

async function addGoals(matchId, teamId, count, rosterByTeam, quotaByTeam) {
  const quotas = quotaByTeam.get(teamId) || [];
  // Artilheiros com cota ficam de fora do sorteio aleatório, senão podem
  // "ganhar" gols extras por sorte depois que a cota deles já foi cumprida.
  const quotaPlayerIds = new Set(quotas.map((q) => q.playerId));
  const roster = rosterByTeam
    .get(teamId)
    .filter((p) => p.position !== "Goleiro" && !quotaPlayerIds.has(p.id));
  for (let i = 0; i < count; i++) {
    // Prioriza o artilheiro real com gols pendentes; o resto vai para o elenco fictício.
    const quota = quotas.find((q) => q.remaining > 0);
    let scorerId;
    if (quota) {
      scorerId = quota.playerId;
      quota.remaining--;
    } else {
      scorerId = rnd(roster.length ? roster : rosterByTeam.get(teamId)).id;
    }
    await prisma.goal.create({
      data: {
        matchId,
        teamId,
        playerId: scorerId,
        minute: Math.floor(Math.random() * 90) + 1,
        penalty: Math.random() < 0.1,
      },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
