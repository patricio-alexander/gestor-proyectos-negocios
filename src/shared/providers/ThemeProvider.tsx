"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "neon";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "gestor-theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("dark", "neon");
  if (mode === "dark") root.classList.add("dark");
  if (mode === "neon") root.classList.add("neon", "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("neon");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode =
      stored === "light" || stored === "dark" || stored === "neon" ? stored : "neon";
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
