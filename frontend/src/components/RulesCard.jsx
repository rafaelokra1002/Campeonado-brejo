const TIEBREAKERS = [
  "Pontos",
  "Vitórias",
  "Saldo de gols",
  "Gols marcados",
  "Confronto direto",
  "Menor número de cartões vermelhos",
  "Menor número de cartões amarelos",
  "Sorteio",
];

// Regras do campeonato: critérios de desempate e suspensão.
export default function RulesCard() {
  return (
    <div className="card p-5 space-y-5">
      <div>
        <h3 className="font-bold mb-3">⚖️ Critérios de desempate</h3>
        <ol className="space-y-1.5">
          {TIEBREAKERS.map((rule, i) => (
            <li key={rule} className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-brand/15 text-brand-400 text-xs font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-gray-200">{rule}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-white/5 pt-4">
        <h3 className="font-bold mb-2">🟨 Suspensão</h3>
        <p className="text-sm text-gray-300">
          Fica suspenso o jogador que receber <span className="font-semibold text-white">3 cartões amarelos</span> ou{" "}
          <span className="font-semibold text-white">expulsão</span>.
        </p>
      </div>
    </div>
  );
}
