// Service worker mínimo para PWA instalável + notificações push. Estratégia
// "rede primeiro": sempre busca a versão mais nova online e só usa o cache
// quando estiver sem internet.
const CACHE = "brejolandense-v7";
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

// Notificação push (gol, início e fim de jogo). O servidor manda { title, body, url, tag }.
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: "Campeonato Brejolandense", body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || "Campeonato Brejolandense", {
      body: data.body || "",
      icon: "/logo-192.png",
      badge: "/logo-64.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

// Ao tocar na notificação: abre (ou volta pra) a página do jogo.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
