"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gestor-sidebar-open";

export const SIDEBAR_WIDTH_OPEN = 256;
export const SIDEBAR_WIDTH_CLOSED = 72;

export function useSidebar() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setOpen(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const close = useCallback(() => persist(false), [persist]);
  const expand = useCallback(() => persist(true), [persist]);
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const width = open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;

  return { open, width, close, expand, toggle };
}
