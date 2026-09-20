import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { useFavoriteTeam } from "../hooks/useFavoriteTeam.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle, TeamBadge } from "../components/ui.jsx";
import { teamFirstName, matchStageLabel } from "../lib/format.js";
import ShareStandingsButton from "../components/ShareStandings.jsx";
import RoundTeamPitch from "../components/RoundTeamPitch.jsx";
import MatchCard from "../components/MatchCard.jsx";
import StandingsTable from "../components/StandingsTable.jsx";
import AdBanner from "../components/AdBanner.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import LiveStream from "../components/LiveStream.jsx";

export default function Home() {
  const { data, loading } = usePolling(() => api.dashboard(), { interval: 15000 });

  if (loading && !data) return <Loader label="Carregando o campeonato..." />;
  if (!data) return <EmptyState title="Não foi possível carregar os dados" subtitle="Verifique se o backend está rodando." />;

  const { live, upcoming, recent, nextKnockoutMatch, standingsByGroup, topScorers, currentRound, totals } = data;
  const groups = Object.keys(standingsByGroup || {}).sort();

  return (
    <div className="space-y-8">
      <HeroBanner />

      <LiveStream />

      <MyTeamSection />

      {/* Faixa de estatísticas + rodada atual */}
      <section className="flex flex-wrap items-center justify-between gap-4 card px-5 py-4">
        <span className="badge bg-brand/15 text-brand-400">Rodada {currentRound} em destaque</span>
        <div className="flex flex-wrap gap-5">
          <Stat value={totals.teams} label="Times" />
          <Stat value={totals.matches} label="Jogos" />
          <Stat value={totals.goals} label="Gols" />
          <Stat value={totals.players} label="Jogadores" />
        </div>
      </section>

      <AdBanner slot="home-top" />

      {/* Ao vivo */}
      {live.length > 0 && (
        <section>
          <SectionTitle>🔴 Ao vivo agora</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* Próximo jogo do mata-mata */}
      {nextKnockoutMatch && (
        <section>
          <SectionTitle action={<Link to="/jogos" className="text-sm text-brand-400 font-semibold">Ver mata-mata</Link>}>
            🏆 Próximo jogo do mata-mata
          </SectionTitle>
          <MatchCard match={nextKnockoutMatch} />
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Próximos jogos */}
        <section>
          <SectionTitle action={<Link to="/jogos" className="text-sm text-brand-400 font-semibold">Ver todos</Link>}>
            📅 Próximos jogos
          </SectionTitle>
          {upcoming.length ? (
            <div className="grid gap-3">{upcoming.slice(0, 3).map((m) => <MatchCard key={m.id} match={m} />)}</div>
          ) : (
            <EmptyState icon="📅" title="Nenhum jogo agendado" />
          )}
        </section>

        {/* Últimos resultados */}
        <section>
          <SectionTitle action={<Link to="/jogos" className="text-sm text-brand-400 font-semibold">Ver todos</Link>}>
            🏁 Últimos resultados
          </SectionTitle>
          {recent.length ? (
            <div className="grid gap-3">{recent.slice(0, 3).map((m) => <MatchCard key={m.id} match={m} />)}</div>
          ) : (
            <EmptyState icon="🏁" title="Nenhum jogo finalizado" />
          )}
        </section>
      </div>

      {/* Tabela resumida por grupo */}
      <section>
        <SectionTitle action={
          <div className="flex items-center gap-3">
            <ShareStandingsButton data={standingsByGroup} className="text-sm text-brand-400 font-semibold">📱 Compartilhar</ShareStandingsButton>
            <Link to="/tabela" className="text-sm text-brand-400 font-semibold">Tabela completa</Link>
          </div>
        }>
          📊 Classificação
        </SectionTitle>
        <div className="grid lg:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Grupo {g}</h3>
              <StandingsTable rows={standingsByGroup[g]} compact promotion={4} relegation={1} />
            </div>
          ))}
        </div>
      </section>

      <LatestRoundTeamSection />

      {/* Artilharia */}
      <section>
        <SectionTitle action={<Link to="/artilharia" className="text-sm text-brand-400 font-semibold">Ver ranking</Link>}>
          🎯 Artilheiros
        </SectionTitle>
        <div className="card divide-y divide-white/5">
          {topScorers.length ? topScorers.map((s) => (
            <Link key={s.playerId} to={`/jogadores/${s.playerId}`} className="flex items-center gap-3 p-3 hover:bg-white/5 transition">
              <span className="w-6 text-center font-black text-gray-500">{s.rank}</span>
              <TeamBadge team={s.team} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-xs text-gray-500">{teamFirstName(s.team.name)}</div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-brand-400">{s.goals}</span>
                <span className="text-xs text-gray-500 ml-1">gols</span>
              </div>
            </Link>
          )) : <EmptyState icon="🎯" title="Sem gols registrados" />}
        </div>
      </section>

      <AdBanner slot="home-bottom" />
    </div>
  );
}

// Última seleção da rodada divulgada (some se o admin ainda não cadastrou nenhuma).
function LatestRoundTeamSection() {
  const { data } = usePolling(() => api.roundTeams(), { interval: 30000 });
  const latest = data?.[0];
  if (!latest) return null;

  return (
    <section>
      <SectionTitle action={<Link to="/selecao" className="text-sm text-brand-400 font-semibold">Ver todas</Link>}>
        ⭐ Seleção · {matchStageLabel(latest)}
      </SectionTitle>
      <RoundTeamPitch picks={latest.picks} />
    </section>
  );
}

function MyTeamSection() {
  const [favoriteId] = useFavoriteTeam();
  const { data: team } = usePolling(() => (favoriteId ? api.team(favoriteId) : Promise.resolve(null)), {
    interval: favoriteId ? 20000 : 0,
    deps: [favoriteId],
  });

  if (!favoriteId) {
    return (
      <Link to="/times" className="card p-4 flex items-center justify-between gap-3 hover:border-brand/40 transition">
        <span className="text-sm text-gray-300">⭐ Escolha seu time do coração pra acompanhar ele aqui</span>
        <span className="text-brand-400 font-semibold text-sm whitespace-nowrap">Escolher →</span>
      </Link>
    );
  }

  if (!team) return null;

  const nextMatch = team.matches.find((m) => m.status !== "FINISHED");
  const lastMatch = [...team.matches].reverse().find((m) => m.status === "FINISHED");

  return (
    <section>
      <SectionTitle action={<Link to={`/times/${team.id}`} className="text-sm text-brand-400 font-semibold">Ver time</Link>}>
        ⭐ Meu time
      </SectionTitle>
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <Link to={`/times/${team.id}`} className="flex items-center gap-3">
          <TeamBadge team={team} size={48} />
          <div>
            <div className="font-bold">{team.name}</div>
            {team.stats && (
              <div className="text-xs text-gray-500">
                Grupo {team.group} · {team.stats.position}º lugar · {team.stats.points} pts
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-[200px] grid sm:grid-cols-2 gap-2">
          {nextMatch && (
            <Link to={`/jogos/${nextMatch.id}`} className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10 transition">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Próximo jogo</div>
              <div className="text-sm font-semibold truncate">
                {teamFirstName(nextMatch.homeTeam.name)} × {teamFirstName(nextMatch.awayTeam.name)}
              </div>
            </Link>
          )}
          {lastMatch && (
            <Link to={`/jogos/${lastMatch.id}`} className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10 transition">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Último resultado</div>
              <div className="text-sm font-semibold truncate">
                {teamFirstName(lastMatch.homeTeam.name)} {lastMatch.homeScore} × {lastMatch.awayScore} {teamFirstName(lastMatch.awayTeam.name)}
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black text-brand-400 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}
