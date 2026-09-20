import { useEffect, useState } from "react";

// O navegador dispara "beforeinstallprompt" uma vez, cedo; guardamos aqui pra
// o botão "Instalar app" poder usar depois.
let deferredPrompt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; });
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Estado da instalação do app neste aparelho:
//   installed (já está instalado) | prompt (Android/Chrome: dá pra instalar com 1 toque)
//   ios (Safari do iPhone: instalar pelo menu Compartilhar) | none
export function useInstall() {
  const [canPrompt, setCanPrompt] = useState(!!deferredPrompt);

  useEffect(() => {
    const onReady = () => setCanPrompt(!!deferredPrompt);
    window.addEventListener("beforeinstallprompt", onReady);
    window.addEventListener("appinstalled", onReady);
    return () => {
      window.removeEventListener("beforeinstallprompt", onReady);
      window.removeEventListener("appinstalled", onReady);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
    setCanPrompt(false);
  }

  const state = isStandalone() ? "installed" : canPrompt ? "prompt" : isIOS() ? "ios" : "none";
  return { state, install };
}
