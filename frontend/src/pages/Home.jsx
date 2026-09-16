import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle, TeamBadge } from "../components/ui.jsx";
import MatchCard from "../components/MatchCard.jsx";
import StandingsTable from "../components/StandingsTable.jsx";
import AdBanner from "../components/AdBanner.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import LiveStream from "../components/LiveStream.jsx";

export default function Home() {
  const { data, loading } = usePolling(() => api.dashboard(), { interval: 15000 });

  if (loading && !data) return <Loader label="Carregando o campeonato..." />;
  if (!data) return <EmptyState title="Não foi possível carregar os dados" subtitle="Verifique se o backend está rodando." />;

  const { live, upcoming, recent, standingsByGroup, topScorers, currentRound, totals } = data;
  const groups = Object.keys(standingsByGroup || {}).sort();

  return (
    <div className="space-y-8">
      <HeroBanner />

      <LiveStream />

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
        <SectionTitle action={<Link to="/tabela" className="text-sm text-brand-400 font-semibold">Tabela completa</Link>}>
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

      {/* Artilharia */}
      <section>
        <SectionTitle action={<Link to="/artilharia" className="text-sm text-brand-400 font-semibold">Ver ranking</Link>}>
          🎯 Artilheiros
        </SectionTitle>
        <div className="card divide-y divide-white/5">
          {topScorers.length ? topScorers.map((s) => (
            <Link key={s.playerId} to={`/times/${s.team.id}`} className="flex items-center gap-3 p-3 hover:bg-white/5 transition">
              <span className="w-6 text-center font-black text-gray-500">{s.rank}</span>
              <TeamBadge team={s.team} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-xs text-gray-500">{s.team.shortName}</div>
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

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black text-brand-400 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}
