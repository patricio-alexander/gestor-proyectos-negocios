import type { DashboardRefreshPayload } from "./realtime-events";

const DEFAULT_INTERNAL_URL = "http://127.0.0.1:3003/internal/emit";

export async function emitDashboardRefresh(
  payload: DashboardRefreshPayload,
): Promise<void> {
  const secret = process.env.REALTIME_INTERNAL_SECRET;
  const url = process.env.REALTIME_INTERNAL_URL ?? DEFAULT_INTERNAL_URL;

  if (!secret) {
    console.warn("[realtime] REALTIME_INTERNAL_SECRET no configurado; omitiendo emit");
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        event: "dashboard:refresh",
        room: "dashboard",
        data: payload,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[realtime] emit falló:", res.status, body);
    }
  } catch (err) {
    console.error("[realtime] emit error:", err);
  }
}
