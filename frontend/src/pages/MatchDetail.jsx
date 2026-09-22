import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, TeamBadge, StatusBadge } from "../components/ui.jsx";
import RulesCard from "../components/RulesCard.jsx";
import LiveControl from "../components/admin/LiveControl.jsx";
import ShareFilesButton from "../components/ShareFiles.jsx";
import BolaoJoin from "../components/BolaoJoin.jsx";
import { usePredictor } from "../hooks/usePredictor.js";
import { buildMatchFiles } from "../lib/matchImage.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatDateTime, shareWhatsApp, matchStageLabel, teamFirstName } from "../lib/format.js";

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: match, loading, refetch } = usePolling(() => api.match(id), { interval: 10000, deps: [id] });
  const [editing, setEditing] = useState(false);

  if (loading && !match) return <Loader />;
  if (!match) return <EmptyState title="Partida não encontrada" />;

  const showScore = match.status !== "SCHEDULED";
  const events = buildTimeline(match);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/jogos" className="text-sm text-gray-400 hover:text-brand-400">← Voltar aos jogos</Link>

      {/* Placar principal */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-center gap-3 mb-6 text-xs text-gray-400">
          <span className="font-semibold">{matchStageLabel(match)}</span>
          <span>·</span>
          <StatusBadge status={match.status} minute={match.minute} />
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          <TeamCol team={match.homeTeam} />
          <div className="text-center">
            {showScore ? (
              <div className="text-5xl sm:text-6xl font-black tabular-nums">
                {match.homeScore}<span className="text-gray-600 mx-2">×</span>{match.awayScore}
              </div>
            ) : (
              <div className="text-4xl text-gray-600 font-black">×</div>
            )}
          </div>
          <TeamCol team={match.awayTeam} />
        </div>

        <div className="text-center mt-6 space-y-1 text-sm text-gray-400">
          <div>🕒 {formatDateTime(match.kickoff)}</div>
          {match.venue && <div>📍 {match.venue}</div>}
        </div>

        <div className="flex justify-center mt-5">
          <ShareFilesButton
            className="btn-primary text-sm"
            modalTitle="Compartilhar jogo"
            shareTitle={`${match.homeTeam.name} x ${match.awayTeam.name}`}
            filenameBase={`jogo-${teamFirstName(match.homeTeam.name)}-x-${teamFirstName(match.awayTeam.name)}`.toLowerCase()}
            loadingLabel="Gerando a imagem do jogo..."
            getFiles={() => buildMatchFiles(match)}
            onText={showScore ? () => shareWhatsApp(match) : undefined}
          >
            📱 Compartilhar
          </ShareFilesButton>
        </div>

        {/* Só aparece pro admin logado: atalho pra lançar/editar gols, cartões e status */}
        {user && (
          <div className="flex justify-center mt-3">
            <button onClick={() => setEditing(true)} className="btn-ghost text-sm border border-brand/40 text-brand-400">
              ⚽ Gols, cartões e status (admin)
            </button>
          </div>
        )}
      </div>

      {editing && (
        <LiveControl matchId={match.id} onClose={() => { setEditing(false); refetch(true); }} />
      )}

      {/* Linha do tempo */}
      {events.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">📋 Lances da partida</h3>
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 ${ev.side === "away" ? "flex-row-reverse text-right" : ""}`}>
                <span className="badge bg-white/5 text-gray-400 tabular-nums w-11 justify-center">{ev.minute ? `${ev.minute}'` : "—"}</span>
                <span className="text-lg">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{ev.text}</span>
                  <span className="text-xs text-gray-500 ml-2">{ev.teamShort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && showScore && (
        <div className="card p-5 text-center text-sm text-gray-500">Nenhum lance detalhado registrado.</div>
      )}

      {/* Enquete "quem vence" — só faz sentido antes da bola rolar */}
      {match.status === "SCHEDULED" && <VotePoll match={match} onVoted={() => refetch(true)} />}

      {/* Confronto direto */}
      {match.headToHead?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">🤝 Confronto direto</h3>
          <div className="space-y-2">
            {match.headToHead.map((m) => (
              <Link
                key={m.id}
                to={`/jogos/${m.id}`}
                className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition text-sm"
              >
                <span className="text-xs text-gray-500 w-20 shrink-0">{formatDate(m.kickoff)}</span>
                <span className="flex-1 text-right font-semibold truncate">{teamFirstName(m.homeTeam.name)}</span>
                <span className="font-black tabular-nums px-2">{m.homeScore} × {m.awayScore}</span>
                <span className="flex-1 font-semibold truncate">{teamFirstName(m.awayTeam.name)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <RulesCard />
    </div>
  );
}

const VOTE_LABELS = { HOME: "Casa", DRAW: "Empate", AWAY: "Fora" };

function VotePoll({ match, onVoted }) {
  const [voted, setVoted] = useState(() => {
    try {
      return localStorage.getItem(`brejo_vote_${match.id}`);
    } catch {
      return null;
    }
  });
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const { predictor, register, clear } = usePredictor();

  const total = match.votesHome + match.votesDraw + match.votesAway;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  async function handleVote(choice) {
    if (voted || voting) return;
    setVoting(true);
    setError("");
    try {
      await api.voteMatch(match.id, choice, predictor ? { id: predictor.id, token: predictor.token } : undefined);
      try { localStorage.setItem(`brejo_vote_${match.id}`, choice); } catch { /* modo privado etc. */ }
      setVoted(choice);
      onVoted();
    } catch (e) {
      if (e.status === 401) {
        clear();
        setError("Não reconheci seu apelido do bolão. Entre de novo e vote outra vez.");
      } else {
        setError(e.message || "Não foi possível registrar seu voto.");
      }
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-4">🔮 Quem vence?</h3>

      {(!voted || predictor) && (
        <div className="mb-4 rounded-xl bg-white/5 p-3 text-xs">
          {predictor ? (
            <span className="text-gray-300">
              🎲 Seu palpite vale no <Link to="/bolao" className="text-brand-400 font-semibold">bolão</Link> como{" "}
              <span className="font-bold text-white">{predictor.nickname}</span>
            </span>
          ) : (
            <div className="space-y-2">
              <div className="text-gray-300">🎲 Quer que seu palpite valha no ranking do bolão? Escolha um apelido:</div>
              <BolaoJoin onRegister={register} />
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="space-y-2">
        {["HOME", "DRAW", "AWAY"].map((choice) => {
          const count = choice === "HOME" ? match.votesHome : choice === "AWAY" ? match.votesAway : match.votesDraw;
          const label = choice === "HOME" ? teamFirstName(match.homeTeam.name) : choice === "AWAY" ? teamFirstName(match.awayTeam.name) : VOTE_LABELS.DRAW;
          const showResults = !!voted;
          return (
            <button
              key={choice}
              onClick={() => handleVote(choice)}
              disabled={!!voted || voting}
              className={`w-full text-left rounded-xl border overflow-hidden relative transition ${
                voted === choice ? "border-brand" : "border-white/10"
              } ${voted ? "cursor-default" : "hover:border-brand/50 cursor-pointer"}`}
            >
              {showResults && (
                <div className="absolute inset-y-0 left-0 bg-brand/15" style={{ width: `${pct(count)}%` }} />
              )}
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <span className="font-semibold text-sm">{label}</span>
                {showResults && <span className="text-sm font-black text-brand-400">{pct(count)}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">{total} {total === 1 ? "voto" : "votos"}{!voted && " · escolha uma opção pra ver o resultado"}</p>
    </div>
  );
}

function TeamCol({ team }) {
  return (
    <Link to={`/times/${team.id}`} className="flex flex-col items-center gap-2 group">
      <TeamBadge team={team} size={64} />
      <span className="font-bold text-sm text-center group-hover:text-brand-400 transition">{teamFirstName(team.name)}</span>
    </Link>
  );
}

// Junta gols e cartões numa timeline ordenada por minuto.
function buildTimeline(match) {
  const events = [];
  for (const g of match.goals || []) {
    // Gol contra aparece do lado de quem ganhou o ponto.
    const playerSide = g.teamId === match.homeTeam.id ? "home" : "away";
    const side = g.ownGoal ? (playerSide === "home" ? "away" : "home") : playerSide;
    events.push({
      minute: g.minute,
      side,
      icon: g.ownGoal ? "🥅" : "⚽",
      text: g.ownGoal
        ? `${g.player?.name ? `${g.player.name} (contra)` : "Gol contra"}`
        : `${g.player?.name || "Gol"}${g.penalty ? " (pên.)" : ""}`,
      teamShort: teamFirstName(side === "home" ? match.homeTeam.name : match.awayTeam.name),
    });
  }
  for (const c of match.cards || []) {
    const side = c.teamId === match.homeTeam.id ? "home" : "away";
    events.push({
      minute: c.minute,
      side,
      icon: c.type === "RED" ? "🟥" : "🟨",
      text: c.player?.name || (c.type === "RED" ? "Cartão vermelho" : "Cartão amarelo"),
      teamShort: teamFirstName(side === "home" ? match.homeTeam.name : match.awayTeam.name),
    });
  }
  return events.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
}
