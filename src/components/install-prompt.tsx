"use client";

import { useEffect, useState } from "react";
import { Plus, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "liens-install-prompt-dismissed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function dismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    // Ignore private browsing storage failures.
  }
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (dismissed() || isStandalone()) return;

    queueMicrotask(() => {
      const iosSafari = isIosSafari();
      setShowIosGuide(iosSafari);
      setHidden(!iosSafari);
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") rememberDismissed();
    setInstallEvent(null);
    setHidden(true);
  }

  function close() {
    rememberDismissed();
    setHidden(true);
  }

  return (
    <aside className="mx-3 mt-3 rounded-xl border bg-card p-3 shadow-sm md:hidden">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground text-background">
          <Smartphone className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Installer Liens</p>
          {showIosGuide ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              Safari: <Share className="size-3.5" /> puis <Plus className="size-3.5" /> {"Ajouter a l'ecran d'accueil."}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Ouvrir Liens comme une app, sans barre de navigateur.</p>
          )}
        </div>
        {installEvent ? (
          <Button type="button" size="sm" onClick={install}>Installer</Button>
        ) : (
          <Button type="button" variant="ghost" size="icon-sm" onClick={close} title="Fermer"><X /></Button>
        )}
      </div>
      {installEvent && (
        <button type="button" onClick={close} className="mt-2 w-full text-center text-xs text-muted-foreground">
          Plus tard
        </button>
      )}
    </aside>
  );
}
