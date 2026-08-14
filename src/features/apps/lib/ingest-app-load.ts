import { prisma } from "@/src/shared/lib/prisma";

export type AppLoadMinuteInput = {
  interval_start: string;
  requests?: number;
  bytes_in?: number;
  bytes_out?: number;
  errors?: number;
  latency_p95_ms?: number | null;
};

function toNonNegInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function truncateToMinute(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCSeconds(0, 0);
  return date;
}

export async function ingestAppLoadMinute(
  appId: number,
  body: AppLoadMinuteInput,
) {
  const intervalStart = truncateToMinute(body.interval_start);
  if (!intervalStart) {
    throw Object.assign(new Error("interval_start inválido"), { statusCode: 400 });
  }

  const requests = toNonNegInt(body.requests);
  const bytesIn = BigInt(toNonNegInt(body.bytes_in));
  const bytesOut = BigInt(toNonNegInt(body.bytes_out));
  const errors = toNonNegInt(body.errors);
  const latency =
    body.latency_p95_ms == null || body.latency_p95_ms === ""
      ? null
      : toNonNegInt(body.latency_p95_ms);

  return prisma.appLoadMinute.upsert({
    where: {
      app_id_interval_start: {
        app_id: appId,
        interval_start: intervalStart,
      },
    },
    create: {
      app_id: appId,
      interval_start: intervalStart,
      requests,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      errors,
      latency_p95_ms: latency,
    },
    update: {
      requests,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      errors,
      latency_p95_ms: latency,
    },
  });
}
