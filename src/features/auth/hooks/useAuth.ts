"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthRole, AuthUser } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

const ACTIVE_ROLE_KEY = "gestor-active-role-id";

export function useAuth() {
  const [state, setState] = useState<{
    user: AuthUser | null;
    loading: boolean;
  }>({ user: null, loading: true });
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

      fetch(apiUrl("/api/auth/me"))
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

  useEffect(() => {
    if (!state.user?.roles?.length) {
      setActiveRoleId(null);
      return;
    }
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
    const parsed = stored ? Number(stored) : null;
    const valid =
      parsed != null && state.user.roles.some((r) => r.id === parsed)
        ? parsed
        : state.user.roles[0].id;
    setActiveRoleId(valid);
    localStorage.setItem(ACTIVE_ROLE_KEY, String(valid));
  }, [state.user]);

  const activeRole: AuthRole | null =
    state.user?.roles.find((r) => r.id === activeRoleId) ?? state.user?.roles[0] ?? null;

  const changeRole = useCallback((roleId: number) => {
    localStorage.setItem(ACTIVE_ROLE_KEY, String(roleId));
    setActiveRoleId(roleId);
  }, []);

  const logout = useCallback(async () => {
    await fetch(apiUrl("/api/auth/logout"), { method: "POST" });
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    setActiveRoleId(null);
    setState({ user: null, loading: false });
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    activeRole,
    activeRoleId,
    changeRole,
    logout,
  };
}
