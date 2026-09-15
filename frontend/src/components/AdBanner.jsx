import { useEffect, useState } from "react";
import { api, resolveCrestUrl } from "../api/client.js";

const AUTOPLAY_MS = 5000;

// Espaço de propaganda/patrocinador. Busca os anúncios ativos de um "slot"
// (posição no site) e não renderiza nada se não houver nenhum configurado.
// Quando há mais de um anúncio, exibe em formato de slide (um por vez,
// trocando automaticamente, com bolinhas indicando a posição).
export default function AdBanner({ slot, className = "" }) {
  const [ads, setAds] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    setIndex(0);
    api.ads(slot).then((data) => alive && setAds(data)).catch(() => alive && setAds([]));
    return () => { alive = false; };
  }, [slot]);

  useEffect(() => {
    if (!ads || ads.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % ads.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [ads]);

  if (!ads || ads.length === 0) return null;

  const current = index % ads.length;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white ${className}`}>
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.linkUrl || undefined}
            target={ad.linkUrl ? "_blank" : undefined}
            rel={ad.linkUrl ? "noopener noreferrer" : undefined}
            className="w-full shrink-0 block"
            title={ad.title}
          >
            {/* aspect-ratio próxima da dos banners (bem largos) + object-cover:
                a caixa acompanha a largura da tela sem sobrar espaço em branco
                e sem cortar tanto quanto uma altura fixa e baixa cortaria. */}
            <div className="aspect-[3/1]">
              <img src={resolveCrestUrl(ad.imageUrl)} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          </a>
        ))}
      </div>

      <span className="absolute top-2 right-2 badge bg-black/60 text-gray-300 text-[10px]">Publicidade</span>

      {ads.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Anúncio ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-gray-800" : "w-1.5 bg-gray-400/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
