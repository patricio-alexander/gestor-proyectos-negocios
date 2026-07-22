/** Comprueba si el backend de entitlement responde (cualquier HTTP = en línea). */

export type EntitlementProbeResult = {
  online: boolean;
  status?: number;
  error?: string;
  latencyMs: number;
};

export type AppSyncHealthState =
  | "not_configured"
  | "no_secret"
  | "online"
  | "offline";

export type AppSyncHealthRow = {
  app_id: number;
  state: AppSyncHealthState;
  latency_ms: number | null;
  http_status: number | null;
  error: string | null;
};

export async function probeEntitlementUrl(
  url: string,
  secret?: string | null,
  timeoutMs = 4_000,
): Promise<EntitlementProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "manual",
      cache: "no-store",
    });
    // Cualquier respuesta HTTP implica que el proceso está arriba y hay red.
    return {
      online: true,
      status: res.status,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Error de red");
    return {
      online: false,
      error: message,
      latencyMs: Date.now() - started,
    };
  }
}
