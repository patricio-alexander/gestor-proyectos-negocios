const DEFAULT_REALTIME_URL = "http://localhost:3003";

/** Host del worker realtime (sin path). */
export function socketUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/\/$/, "") ?? DEFAULT_REALTIME_URL;
}

/** Path Socket.IO alineado con NEXT_PUBLIC_BASE_PATH → /raptorsolutions/socket.io */
export function socketPath(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  return base ? `${base}/socket.io` : "/socket.io";
}
