// Service worker mínimo para PWA instalável. Estratégia "rede primeiro": sempre
// busca a versão mais nova online e só usa o cache quando estiver sem internet.
const CACHE = "brejolandense-v6";
const ASSETS = ["/", "/index.html", "/logo-192.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Nunca cacheia a API (dados sempre atualizados).
  if (request.url.includes("/api/")) return;
  if (request.method !== "GET") return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
  );
});
