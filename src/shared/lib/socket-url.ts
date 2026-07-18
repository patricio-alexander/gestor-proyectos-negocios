const DEFAULT_REALTIME_URL = "http://localhost:3003";

export function socketUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/\/$/, "") ?? DEFAULT_REALTIME_URL;
}
