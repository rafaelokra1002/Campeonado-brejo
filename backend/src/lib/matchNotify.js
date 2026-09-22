import { notify } from "./push.js";

const first = (name) => (name || "").split(" ")[0];

const scoreLine = (m) => `${first(m.homeTeam.name)} ${m.homeScore} x ${m.awayScore} ${first(m.awayTeam.name)}`;

// Início e fim de jogo: compara o status de antes com o de agora.
export function notifyStatusChange(previousStatus, match) {
  if (previousStatus === match.status) return;

  if (match.status === "LIVE" && previousStatus === "SCHEDULED") {
    notify({
      title: "⚽ A bola rolou!",
      body: `${first(match.homeTeam.name)} x ${first(match.awayTeam.name)} começou. Acompanhe ao vivo.`,
      url: `/jogos/${match.id}`,
      tag: `match-${match.id}`,
    });
  } else if (match.status === "FINISHED") {
    notify({
      title: "🏁 Fim de jogo",
      body: scoreLine(match),
      url: `/jogos/${match.id}`,
      tag: `match-${match.id}`,
    });
  }
}

// Gol durante o jogo (correções em jogo encerrado não avisam ninguém).
export function notifyGoal(match, scorerName, ownGoal = false) {
  if (match.status !== "LIVE") return;
  const body = ownGoal
    ? scorerName ? `Gol contra de ${scorerName}` : "Gol contra"
    : scorerName ? `Gol de ${scorerName}` : "Confira os lances";
  notify({
    title: `⚽ GOL! ${scoreLine(match)}`,
    body,
    url: `/jogos/${match.id}`,
    tag: `match-${match.id}`,
  });
}
