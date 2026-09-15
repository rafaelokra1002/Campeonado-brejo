import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState } from "../components/ui.jsx";
import StandingsTable from "../components/StandingsTable.jsx";

export default function Standings() {
  const { data, loading } = usePolling(() => api.standingsByGroup(), { interval: 20000 });

  if (loading && !data) return <Loader />;

  const groups = Object.keys(data || {}).sort();
  if (!groups.length) return <EmptyState icon="📊" title="Sem classificação ainda" />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">📊 Classificação</h1>
        <p className="text-sm text-gray-400 mt-1">
          P = Pontos · J = Jogos · V = Vitórias · E = Empates · D = Derrotas · GP = Gols Pró · GC = Gols Contra · SG = Saldo
        </p>
      </div>

      {groups.map((g) => (
        <section key={g}>
          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
            <span className="badge bg-brand/15 text-brand-400">Grupo {g}</span>
          </h2>
          <StandingsTable rows={data[g]} promotion={2} />
        </section>
      ))}
    </div>
  );
}
