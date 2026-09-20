import { useEffect, useState } from "react";
import { usePolling } from "../hooks/usePolling.js";
import { api } from "../api/client.js";
import { Loader, EmptyState, SectionTitle } from "../components/ui.jsx";
import MatchCard from "../components/MatchCard.jsx";
import AdBanner from "../components/AdBanner.jsx";
import { PHASES, phaseLabel, shareRoundText } from "../lib/format.js";
import ShareFilesButton from "../components/ShareFiles.jsx";
import { buildRoundFiles } from "../lib/roundImage.js";

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "LIVE", label: "🔴 Ao vivo" },
  { key: "SCHEDULED", label: "Agendados" },
  { key: "FINISHED", label: "Encerrados" },
];

export default function Matches() {
  const [phase, setPhase] = useState("GROUP");
  const [rounds, setRounds] = useState([]);
  const [round, setRound] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.rounds().then((r) => setRounds(r)).catch(() => {});
  }, []);

  const { data, loading } = usePolling(
    () => api.matches({ phase, ...(phase === "GROUP" && round && { round }), ...(status && { status }) }),
    { interval: 12000, deps: [phase, round, status] }
  );

  // Na fase de grupos agrupa por rodada; no mata-mata é só uma listinha direta.
  const grouped = (data || []).reduce((acc, m) => {
    (acc[m.round] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>⚽ Jogos & Partidas</SectionTitle>

      <AdBanner slot="jogos-topo" />

      {/* Fase */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map((p) => (
          <button
            key={p.key}
            onClick={() => { setPhase(p.key); setRound(""); }}
            className={`chip ${phase === p.key ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`chip ${status === f.key ? "bg-brand text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro de rodada (só faz sentido na fase de grupos) */}
      {phase === "GROUP" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setRound("")}
            className={`chip ${round === "" ? "bg-accent text-night-950" : "bg-white/5 text-gray-300"}`}
          >
            Todas rodadas
          </button>
          {rounds.map((r) => (
            <button
              key={r}
              onClick={() => setRound(String(r))}
              className={`chip ${round === String(r) ? "bg-accent text-night-950" : "bg-white/5 text-gray-300"}`}
            >
              Rodada {r}
            </button>
          ))}
        </div>
      )}

      {loading && !data ? (
        <Loader />
      ) : !data?.length ? (
        <EmptyState icon="⚽" title="Nenhum jogo encontrado" subtitle="Ajuste os filtros acima." />
      ) : phase === "GROUP" ? (
        Object.entries(grouped).map(([r, matches]) => (
          <div key={r} className="space-y-3">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Rodada {r}</h3>
              <ShareRound title={`Rodada ${r}`} filenameBase={`rodada-${r}-brejolandense`} matches={matches} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">{phaseLabel(phase)}</h3>
            <ShareRound title={phaseLabel(phase)} filenameBase={`${phase.toLowerCase()}-brejolandense`} matches={data} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// Botão de compartilhar uma rodada (ou fase do mata-mata) como imagem, PDF ou texto.
function ShareRound({ title, filenameBase, matches }) {
  return (
    <ShareFilesButton
      className="text-sm text-brand-400 font-semibold"
      modalTitle={`Compartilhar ${title.toLowerCase()}`}
      shareTitle={`${title} · Campeonato Brejolandense`}
      filenameBase={filenameBase}
      loadingLabel="Gerando a imagem da rodada..."
      getFiles={() => buildRoundFiles({ title, matches })}
      onText={() => shareRoundText(title, matches)}
    >
      📱 Compartilhar
    </ShareFilesButton>
  );
}
