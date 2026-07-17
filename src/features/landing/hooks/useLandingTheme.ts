"use client";

import { useEffect } from "react";
import { restoreStoredTheme } from "@/src/shared/providers/ThemeProvider";

/** Tema exclusivo de la landing (fondo negro + acento #FF6B00). Restaura al salir. */
export function useLandingTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "neon");
    root.setAttribute("data-theme", "landing");

    return () => {
      restoreStoredTheme();
    };
  }, []);
}
