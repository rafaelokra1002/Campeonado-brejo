import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import TeamsAdmin from "../components/admin/TeamsAdmin.jsx";
import PlayersAdmin from "../components/admin/PlayersAdmin.jsx";
import MatchesAdmin from "../components/admin/MatchesAdmin.jsx";
import AdsAdmin from "../components/admin/AdsAdmin.jsx";
import SettingsAdmin from "../components/admin/SettingsAdmin.jsx";

const TABS = [
  { key: "matches", label: "⚽ Jogos", Comp: MatchesAdmin },
  { key: "teams", label: "🛡️ Times", Comp: TeamsAdmin },
  { key: "players", label: "👥 Jogadores", Comp: PlayersAdmin },
  { key: "ads", label: "📢 Propagandas", Comp: AdsAdmin },
  { key: "settings", label: "🎨 Capa da Home", Comp: SettingsAdmin },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("matches");
  const Active = TABS.find((t) => t.key === tab).Comp;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Painel Administrativo</h1>
        <p className="text-sm text-gray-400">Bem-vindo, {user?.name}. Gerencie o campeonato aqui.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`chip ${tab === t.key ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
