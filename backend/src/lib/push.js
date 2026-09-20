import webpush from "web-push";
import { prisma } from "./prisma.js";

// Notificações push (Web Push). Só funciona se as chaves VAPID estiverem nas
// variáveis de ambiente (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, opcional VAPID_SUBJECT).
// Sem elas o recurso fica desligado e o site simplesmente não mostra o botão.

let configured = null;

function setup() {
  if (configured !== null) return configured;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  configured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
  if (configured) {
    webpush.setVapidDetails(
      VAPID_SUBJECT || "mailto:contato@campeonatobrejolandense.online",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
  }
  return configured;
}

export function pushPublicKey() {
  return setup() ? process.env.VAPID_PUBLIC_KEY : null;
}

const defaultSend = (subscription, body) => webpush.sendNotification(subscription, body, { TTL: 60 * 60 });

// Envia para todos os dispositivos inscritos e remove os que não existem mais.
// `send` e `enabled` existem só pra permitir testar sem enviar de verdade.
export async function sendToAll(payload, { send = defaultSend, enabled = setup() } = {}) {
  if (!enabled) return { sent: 0, removed: 0 };

  const subs = await prisma.pushSubscription.findMany();
  const body = JSON.stringify(payload);
  let sent = 0;
  const dead = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        sent++;
      } catch (e) {
        if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  return { sent, removed: dead.length };
}

// Dispara sem esperar (a resposta da API ao admin não depende disso).
export function notify(payload) {
  sendToAll(payload).catch((e) => console.error("push:", e.message));
}
