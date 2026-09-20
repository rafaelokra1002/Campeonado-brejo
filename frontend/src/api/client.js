// Cliente HTTP simples baseado em fetch.
const API_ORIGIN = import.meta.env.VITE_API_URL || "";
const BASE = API_ORIGIN + "/api";

function getToken() {
  return localStorage.getItem("brejo_token");
}

// Escudos enviados via upload voltam como caminho relativo (/api/uploads/...);
// aqui viram URL absoluta para o <img> funcionar mesmo com front e back em domínios diferentes.
// Uma URL externa (http...) ou um emoji passam direto.
export function resolveCrestUrl(crest) {
  if (!crest) return null;
  if (/^https?:\/\//.test(crest)) return crest;
  if (crest.startsWith("/")) return API_ORIGIN + crest;
  return crest;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Erro na requisição");
    err.details = data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Público
  dashboard: () => request("/dashboard"),
  standings: () => request("/standings"),
  standingsByGroup: () => request("/standings?grouped=1"),
  scorers: () => request("/scorers"),
  cardsRanking: () => request("/cards-ranking"),
  teams: () => request("/teams"),
  team: (id) => request(`/teams/${id}`),
  players: (teamId) => request(`/players${teamId ? `?teamId=${teamId}` : ""}`),
  player: (id) => request(`/players/${id}`),
  matches: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/matches${q ? `?${q}` : ""}`);
  },
  rounds: () => request("/matches/rounds"),
  match: (id) => request(`/matches/${id}`),
  voteMatch: (id, choice, predictor) => request(`/matches/${id}/vote`, { method: "POST", body: { choice, ...(predictor && { predictor }) } }),
  ads: (slot) => request(`/ads${slot ? `?slot=${encodeURIComponent(slot)}` : ""}`),
  roundTeams: () => request("/round-teams"),
  votePick: (pickId) => request(`/round-teams/picks/${pickId}/vote`, { method: "POST" }),
  pushPublicKey: () => request("/push/public-key"),
  pushSubscribe: (subscription) => request("/push/subscribe", { method: "POST", body: subscription }),
  pushUnsubscribe: (endpoint) => request("/push/unsubscribe", { method: "POST", body: { endpoint } }),
  bolao: () => request("/bolao"),
  bolaoRegister: (nickname) => request("/bolao/register", { method: "POST", body: { nickname } }),
  settings: () => request("/settings"),
  follow: () => request("/settings/follow", { method: "POST" }),
  unfollow: () => request("/settings/unfollow", { method: "POST" }),

  // Auth
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me", { auth: true }),

  // Admin - Times
  createTeam: (body) => request("/teams", { method: "POST", body, auth: true }),
  updateTeam: (id, body) => request(`/teams/${id}`, { method: "PUT", body, auth: true }),
  deleteTeam: (id) => request(`/teams/${id}`, { method: "DELETE", auth: true }),

  // Admin - Jogadores
  createPlayer: (body) => request("/players", { method: "POST", body, auth: true }),
  updatePlayer: (id, body) => request(`/players/${id}`, { method: "PUT", body, auth: true }),
  deletePlayer: (id) => request(`/players/${id}`, { method: "DELETE", auth: true }),

  // Admin - Jogos
  createMatch: (body) => request("/matches", { method: "POST", body, auth: true }),
  updateMatch: (id, body) => request(`/matches/${id}`, { method: "PUT", body, auth: true }),
  deleteMatch: (id) => request(`/matches/${id}`, { method: "DELETE", auth: true }),
  updateScore: (id, body) => request(`/matches/${id}/score`, { method: "PATCH", body, auth: true }),
  addGoal: (id, body) => request(`/matches/${id}/goals`, { method: "POST", body, auth: true }),
  updateGoal: (id, goalId, body) => request(`/matches/${id}/goals/${goalId}`, { method: "PUT", body, auth: true }),
  removeGoal: (id, goalId) => request(`/matches/${id}/goals/${goalId}`, { method: "DELETE", auth: true }),
  addCard: (id, body) => request(`/matches/${id}/cards`, { method: "POST", body, auth: true }),
  updateCard: (id, cardId, body) => request(`/matches/${id}/cards/${cardId}`, { method: "PUT", body, auth: true }),
  removeCard: (id, cardId) => request(`/matches/${id}/cards/${cardId}`, { method: "DELETE", auth: true }),

  // Admin - Propagandas
  adsAll: () => request("/ads/all", { auth: true }),
  createAd: (body) => request("/ads", { method: "POST", body, auth: true }),
  updateAd: (id, body) => request(`/ads/${id}`, { method: "PUT", body, auth: true }),
  deleteAd: (id) => request(`/ads/${id}`, { method: "DELETE", auth: true }),

  // Admin - Seleção da rodada
  saveRoundTeam: (body) => request("/round-teams", { method: "PUT", body, auth: true }),
  deleteRoundTeam: (id) => request(`/round-teams/${id}`, { method: "DELETE", auth: true }),

  // Admin - Configurações (banner da home, organizador)
  updateSettings: (body) => request("/settings", { method: "PUT", body, auth: true }),

  // Upload de imagem (escudo de time, banner de propaganda, etc.)
  uploadImage: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    const res = await fetch(BASE + "/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Falha no upload da imagem.");
    return data; // { url }
  },
};
