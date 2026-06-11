"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "../types";

export function useAuth() {
  const [state, setState] = useState<{
    user: AuthUser | null;
    loading: boolean;
  }>({ user: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          if (!cancelled) setState({ user: null, loading: false });
          return;
        }
        return res.json().then((data) => {
          if (!cancelled) setState({ user: data.user, loading: false });
        });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, loading: false });
  }, []);

  return { ...state, logout };
}
