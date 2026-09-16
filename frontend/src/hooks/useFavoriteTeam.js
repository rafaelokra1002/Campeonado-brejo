import { useEffect, useState } from "react";

const KEY = "brejo_favorite_team";

// Time do coração do torcedor: guardado só no navegador dele (sem cadastro).
export function useFavoriteTeam() {
  const [favoriteId, setFavoriteId] = useState(() => {
    try {
      return localStorage.getItem(KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (favoriteId) localStorage.setItem(KEY, favoriteId);
      else localStorage.removeItem(KEY);
    } catch {
      // sem acesso ao localStorage (modo privado etc.): segue só em memória
    }
  }, [favoriteId]);

  return [favoriteId, setFavoriteId];
}
