import { prisma } from "@/src/shared/lib/prisma";

/** Llega por JSON desde las apps: los numéricos pueden venir como texto. */
export type AppLoadSampleInput = {
  interval_start: string;
  requests?: number | string;
  bytes_in?: number | string;
  bytes_out?: number | string;
  errors?: number | string;
  latency_p95_ms?: number | string | null;
};

function toNonNegInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function truncateToTenSeconds(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMilliseconds(0);
  date.setUTCSeconds(Math.floor(date.getUTCSeconds() / 10) * 10);
  return date;
}

function truncateToMinute(date: Date) {
  const copy = new Date(date);
  copy.setUTCSeconds(0, 0);
  return copy;
}

export async function ingestAppLoadSample(
  appId: number,
  body: AppLoadSampleInput,
) {
  const intervalStart = truncateToTenSeconds(body.interval_start);
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

  const sample = await prisma.appLoadSample.upsert({
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

  const minuteStart = truncateToMinute(intervalStart);
  const nextMinute = new Date(minuteStart.getTime() + 60_000);
  const minuteSamples = await prisma.appLoadSample.findMany({
    where: {
      app_id: appId,
      interval_start: { gte: minuteStart, lt: nextMinute },
    },
  });
  const minuteRequests = minuteSamples.reduce((sum, row) => sum + row.requests, 0);
  const minuteBytesIn = minuteSamples.reduce((sum, row) => sum + row.bytes_in, BigInt(0));
  const minuteBytesOut = minuteSamples.reduce((sum, row) => sum + row.bytes_out, BigInt(0));
  const minuteErrors = minuteSamples.reduce((sum, row) => sum + row.errors, 0);
  const latencies = minuteSamples
    .map((row) => row.latency_p95_ms)
    .filter((value): value is number => value != null);
  const minuteLatency = latencies.length
    ? Math.max(...latencies)
    : null;

  await prisma.appLoadMinute.upsert({
    where: {
      app_id_interval_start: {
        app_id: appId,
        interval_start: minuteStart,
      },
    },
    create: {
      app_id: appId,
      interval_start: minuteStart,
      requests: minuteRequests,
      bytes_in: minuteBytesIn,
      bytes_out: minuteBytesOut,
      errors: minuteErrors,
      latency_p95_ms: minuteLatency,
    },
    update: {
      requests: minuteRequests,
      bytes_in: minuteBytesIn,
      bytes_out: minuteBytesOut,
      errors: minuteErrors,
      latency_p95_ms: minuteLatency,
    },
  });

  return sample;
}
