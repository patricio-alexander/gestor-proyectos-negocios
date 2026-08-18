export type Bucket = "10s" | "1m" | "1h" | "1d";

export type UsageRow = {
  module: string;
  section: string;
  method?: string;
  requests: number;
};

export type AppLoadPoint = {
  t: string;
  requests: number;
  bytes: number;
  errors: number;
  latency_p95_ms: number | null;
  usage_breakdown: UsageRow[];
};

export type AppLoadSeries = {
  app_id: number;
  app_name: string;
  points: AppLoadPoint[];
};

export type AppLoadResponse = {
  bucket: Bucket;
  from: string;
  to: string;
  series: AppLoadSeries[];
};
