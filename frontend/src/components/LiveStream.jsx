import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { youtubeEmbedUrl } from "../lib/format.js";

// Transmissão ao vivo do campeonato via YouTube. Não renderiza nada se o
// admin não tiver configurado um link em Admin > Site.
export default function LiveStream() {
  const [streamUrl, setStreamUrl] = useState(null);

  useEffect(() => {
    api.settings().then((s) => setStreamUrl(s.streamUrl || null)).catch(() => setStreamUrl(null));
  }, []);

  const embedUrl = youtubeEmbedUrl(streamUrl);
  if (!streamUrl) return null;

  return (
    <section className="card p-4 space-y-3">
      <h2 className="text-lg font-extrabold flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" /> Assista ao vivo
      </h2>
      {embedUrl ? (
        <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
          <iframe
            src={embedUrl}
            title="Transmissão ao vivo"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
          ▶️ Assistir no YouTube
        </a>
      )}
    </section>
  );
}
