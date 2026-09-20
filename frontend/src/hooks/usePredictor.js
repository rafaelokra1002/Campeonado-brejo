import { useState } from "react";
import { api } from "../api/client.js";

const KEY = "brejo_predictor";

export function getPredictor() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

// Participante do bolão: apelido + chave secreta guardados só neste aparelho.
export function usePredictor() {
  const [predictor, setPredictor] = useState(getPredictor);

  async function register(nickname) {
    const r = await api.bolaoRegister(nickname);
    const data = { id: r.id, token: r.token, nickname: r.nickname };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* modo privado etc. */ }
    setPredictor(data);
    return data;
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setPredictor(null);
  }

  return { predictor, register, clear };
}
