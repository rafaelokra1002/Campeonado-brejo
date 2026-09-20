import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling.js";
import { usePredictor } from "../hooks/usePredictor.js";
import { api } from "../api/client.js";
import { Loader, SectionTitle } from "../components/ui.jsx";
import BolaoJoin from "../components/BolaoJoin.jsx";

export default function Bolao() {
  const { data, loading } = usePolling(() => api.bolao(), { interval: 30000 });
  const { predictor, register, clear } = usePredictor();

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle>🎲 Bolão dos palpites</SectionTitle>

      <div className="card p-4 space-y-2 text-sm text-gray-300">
        <p>
          Dê seu palpite (vitória de quem ou empate) nos jogos <span className="font-semibold text-white">antes da bola rolar</span>.
          Cada resultado acertado vale <span className="font-semibold text-white">1 ponto</span>. Quem acertar mais, lidera o ranking.
        </p>
        <Link to="/jogos" className="text-brand-400 font-semibold inline-block">Ver os próximos jogos →</Link>
      </div>

      <div className="card p-4">
        {predictor ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">Você está jogando como</div>
              <div className="font-black text-lg">{predictor.nickname}</div>
            </div>
            <button onClick={clear} className="text-xs text-gray-500 hover:text-red-400">Trocar apelido</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="font-bold text-sm">Escolha um apelido pra entrar</div>
            <BolaoJoin onRegister={register} />
          </div>
        )}
      </div>

      {loading && !data ? (
        <Loader />
      ) : !data?.length ? (
        <div className="card p-6 text-center text-sm text-gray-500">Ninguém palpitou ainda. Seja o primeiro!</div>
      ) : (
        <div className="card divide-y divide-white/5">
          {data.map((row) => {
            const mine = predictor?.id === row.predictorId;
            return (
              <div key={row.predictorId} className={`flex items-center gap-3 p-3 ${mine ? "bg-brand/10" : ""}`}>
                <span className={`w-7 text-center font-black ${row.rank <= 3 ? "text-brand-400" : "text-gray-500"}`}>{row.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{row.nickname}{mine && <span className="text-xs text-brand-400 ml-2">você</span>}</div>
                  <div className="text-xs text-gray-500">
                    {row.played} {row.played === 1 ? "jogo decidido" : "jogos decididos"}
                    {row.pending > 0 && ` · ${row.pending} aguardando`}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-brand-400">{row.hits}</span>
                  <span className="text-xs text-gray-500 ml-1">{row.hits === 1 ? "ponto" : "pontos"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
