import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { HomeIcon, ChartIcon, BallIcon, ShieldIcon, TargetIcon } from "./icons.jsx";

const NAV = [
  { to: "/", label: "Início", Icon: HomeIcon, end: true },
  { to: "/tabela", label: "Tabela", Icon: ChartIcon },
  { to: "/jogos", label: "Jogos", Icon: BallIcon },
  { to: "/times", label: "Times", Icon: ShieldIcon },
  { to: "/artilharia", label: "Artilharia", Icon: TargetIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-night-950">
      {/* Topo */}
      <header className="sticky top-0 z-40 bg-night-950/90 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo-64.png" alt="Campeonato Brejolandense" className="w-12 h-12 object-contain rounded-md" />
            <div className="leading-tight">
              <div className="font-black text-sm sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">Campeonato </span>Brejolandense
              </div>
              <div className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">Futebol</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `chip ${isActive ? "bg-brand text-night-950" : "text-gray-300 hover:bg-white/5"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/admin" className="btn-ghost text-sm py-2 px-3">Painel</Link>
              <button onClick={() => { logout(); navigate("/"); }} className="btn-ghost text-sm py-2 px-3">Sair</button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24 md:pb-10">{children}</main>

      {/* Rodapé */}
      <footer className="hidden md:block border-t border-white/5 py-6 text-center text-xs text-gray-600">
        Campeonato Brejolandense de Futebol · {new Date().getFullYear()}
      </footer>

      {/* Navegação inferior (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-night-900/95 backdrop-blur border-t border-white/10 flex">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                isActive ? "text-brand-400" : "text-gray-500"
              }`
            }
          >
            <item.Icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
