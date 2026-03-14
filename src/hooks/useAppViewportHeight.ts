import { useEffect } from "react";

function setViewportVars() {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const viewport = window.visualViewport;
  const height = viewport ? Math.round(viewport.height) : window.innerHeight;
  const offsetTop = viewport ? Math.max(0, Math.round(viewport.offsetTop)) : 0;

  root.style.setProperty("--app-height", `${height}px`);
  root.style.setProperty("--app-top-offset", `${offsetTop}px`);
}

export function useAppViewportHeight() {
  useEffect(() => {
    let frame = 0;

    const scheduleUpdate = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewportVars();
        frame = 0;
      });
    };

    scheduleUpdate();

    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleUpdate, {
      passive: true,
    });

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
    };
  }, []);
}
