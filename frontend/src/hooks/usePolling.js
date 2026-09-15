import { useCallback, useEffect, useRef, useState } from "react";

// Busca dados de uma função async e re-busca em intervalo (polling) para "tempo real".
export function usePolling(fetcher, { interval = 0, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const savedFetcher = useRef(fetcher);
  savedFetcher.current = fetcher;

  const refetch = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const result = await savedFetcher.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refetch();
    if (!interval) return;
    const id = setInterval(() => refetch(true), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, refetch };
}
