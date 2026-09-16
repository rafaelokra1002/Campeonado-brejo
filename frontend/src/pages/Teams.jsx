import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { useFavoriteTeam } from "../hooks/useFavoriteTeam.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle, TeamBadge } from "../components/ui.jsx";

export default function Teams() {
  const { data, loading } = usePolling(() => api.teams());
  const [favoriteId, setFavoriteId] = useFavoriteTeam();

  if (loading && !data) return <Loader />;
  if (!data?.length) return <EmptyState icon="🛡️" title="Nenhum time cadastrado" />;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>🛡️ Times do campeonato</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((team) => {
          const isFavorite = favoriteId === team.id;
          return (
            <Link
              key={team.id}
              to={`/times/${team.id}`}
              className="relative card p-4 flex items-center gap-3 hover:border-brand/40 hover:-translate-y-0.5 transition-all"
            >
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setFavoriteId(isFavorite ? null : team.id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-night-950/60 flex items-center justify-center text-sm"
                title={isFavorite ? "Remover dos favoritos" : "Marcar como meu time"}
                aria-label={isFavorite ? "Remover dos favoritos" : "Marcar como meu time"}
              >
                {isFavorite ? "⭐" : "☆"}
              </button>
              <TeamBadge team={team} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{team.name}</div>
                <div className="text-xs text-gray-500">
                  Grupo {team.group} · {team._count?.players ?? 0} jogadores
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
