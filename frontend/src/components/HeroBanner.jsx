import { useEffect, useState } from "react";
import { api, resolveCrestUrl } from "../api/client.js";
import { shareSite } from "../lib/format.js";

const FOLLOW_KEY = "brejo_following";

// Banner de capa da home: foto de fundo, organizador, seguidores, seguir e compartilhar.
export default function HeroBanner() {
  const [settings, setSettings] = useState(null);
  const [following, setFollowing] = useState(() => localStorage.getItem(FOLLOW_KEY) === "1");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.settings().then(setSettings).catch(() => setSettings({ organizerName: "", bannerImage: null, followers: 0 }));
  }, []);

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    const next = !following;
    try {
      const updated = next ? await api.follow() : await api.unfollow();
      setFollowing(next);
      localStorage.setItem(FOLLOW_KEY, next ? "1" : "0");
      setSettings(updated);
    } catch {
      // sem rede: não muda o estado
    } finally {
      setBusy(false);
    }
  }

  const bannerUrl = settings?.bannerImage ? resolveCrestUrl(settings.bannerImage) : null;
  const followers = settings?.followers ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[220px] sm:min-h-[280px] flex flex-col justify-between bg-contain bg-center bg-no-repeat"
      style={{
        backgroundColor: "#0a0f1a",
        backgroundImage: bannerUrl
          ? `linear-gradient(to top, rgba(10,15,26,0.92), rgba(10,15,26,0.15) 55%), url(${bannerUrl})`
          : undefined,
      }}
    >
      {/* Fundo padrão (sem foto configurada ainda) */}
      {!bannerUrl && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-night-800 via-night-900 to-night-950" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl" />
        </>
      )}

      <div className="relative p-4 sm:p-6 flex items-start justify-between gap-3">
        {settings?.organizerName ? (
          <div className="bg-night-900/80 backdrop-blur rounded-xl px-4 py-2.5 border border-white/10">
            <div className="text-[11px] text-gray-300">Organizador</div>
            <div className="font-bold text-sm sm:text-base">{settings.organizerName}</div>
          </div>
        ) : <span />}
      </div>

      <div className="relative p-4 sm:p-6">
        {!bannerUrl && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-2">
              Campeonato <span className="text-brand-400">Brejolandense</span>
            </h1>
            <p className="text-gray-400 max-w-md mb-4">Acompanhe a tabela, jogos ao vivo, artilharia e tudo sobre o campeonato em um só lugar.</p>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="badge bg-night-900/80 backdrop-blur text-gray-200 border border-white/10">
            Público · {followers} {followers === 1 ? "Seguidor" : "Seguidores"}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`chip font-bold ${following ? "bg-white/10 text-gray-200 border border-white/20" : "bg-accent text-night-950"}`}
            >
              {following ? "SEGUINDO" : "SEGUIR"}
            </button>
            <button
              onClick={() => shareSite("Campeonato Brejolandense")}
              className="w-9 h-9 rounded-full bg-accent text-night-950 flex items-center justify-center shrink-0"
              title="Compartilhar"
              aria-label="Compartilhar"
            >
              ↗
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
