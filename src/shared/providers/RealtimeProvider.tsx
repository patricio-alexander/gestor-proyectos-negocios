"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  applyRealtimeEvent,
  invalidateEventStats,
} from "@/src/features/events/lib/realtime-events-cache";
import {
  REALTIME_EVENTS,
  type DashboardRefreshPayload,
} from "@/src/shared/lib/realtime-events";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { socketUrl } from "@/src/shared/lib/socket-url";
import { apiUrl } from "@/src/utils/apiUrl";

type RealtimeStatus = "connecting" | "connected" | "disconnected";

const RealtimeStatusContext = createContext<RealtimeStatus>("connecting");

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext);
}

function invalidateDashboardQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.kanban.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

function handleDashboardRefresh(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: DashboardRefreshPayload,
) {
  if (payload.event) {
    applyRealtimeEvent(queryClient, payload.event);
    invalidateEventStats(queryClient);
    return;
  }

  invalidateDashboardQueries(queryClient);
  void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes.all });
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch(apiUrl("/api/auth/realtime-token"));
        if (!res.ok || cancelled) {
          setStatus("disconnected");
          return;
        }

        const { token } = (await res.json()) as { token?: string };
        if (!token || cancelled) {
          setStatus("disconnected");
          return;
        }

        const socket = io(socketUrl(), {
          auth: { token },
          transports: ["websocket", "polling"],
          path: "/socket.io",
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (!cancelled) setStatus("connected");
        });

        socket.on("disconnect", () => {
          if (!cancelled) setStatus("disconnected");
        });

        socket.on(REALTIME_EVENTS.dashboardRefresh, (payload: DashboardRefreshPayload) => {
          handleDashboardRefresh(queryClient, payload);
        });

        socket.on("connect_error", (err) => {
          console.warn("[realtime] connect_error:", err.message);
          if (!cancelled) setStatus("disconnected");
        });
      } catch (err) {
        console.warn("[realtime] no se pudo conectar:", err);
        if (!cancelled) setStatus("disconnected");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
    };
  }, [queryClient]);

  return (
    <RealtimeStatusContext.Provider value={status}>
      {children}
    </RealtimeStatusContext.Provider>
  );
}
