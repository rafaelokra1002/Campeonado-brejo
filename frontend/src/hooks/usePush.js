import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// Estado das notificações push neste aparelho:
//   loading | unsupported | disabled (servidor sem chaves) | denied | off | on
export function usePush() {
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supported()) return alive && setStatus("unsupported");
      try {
        const { publicKey } = await api.pushPublicKey();
        if (!publicKey) return alive && setStatus("disabled");
        // Em desenvolvimento o service worker não é registrado (veja main.jsx).
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return alive && setStatus("unsupported");
        if (Notification.permission === "denied") return alive && setStatus("denied");
        const sub = await reg.pushManager.getSubscription();
        alive && setStatus(sub ? "on" : "off");
      } catch {
        alive && setStatus("unsupported");
      }
    })();
    return () => { alive = false; };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const { publicKey } = await api.pushPublicKey();
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await api.pushSubscribe(sub.toJSON());
      setStatus("on");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api.pushUnsubscribe(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable, disable };
}
