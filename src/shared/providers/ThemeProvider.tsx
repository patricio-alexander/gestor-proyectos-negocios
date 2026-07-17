"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** light = hielo azul · dark = espacio · neo = eléctrico · orange = naranja */
export type ThemeMode = "light" | "dark" | "neo" | "orange";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "gestor-theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeStoredTheme(value: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "neo" || value === "orange") {
    return value;
  }
  if (value === "neon") return "neo";
  return "orange";
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("dark", "neon");
  root.setAttribute("data-theme", mode);

  if (mode === "dark" || mode === "neo") {
    root.classList.add("dark");
  }
  if (mode === "neo") {
    root.classList.add("neon");
  }
}

export function restoreStoredTheme() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  applyTheme(normalizeStoredTheme(stored));
}

export function applyLandingTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "neon");
  root.setAttribute("data-theme", "landing");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("orange");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = normalizeStoredTheme(stored);
    setModeState(initial);
    applyTheme(initial);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    applyTheme(next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}
