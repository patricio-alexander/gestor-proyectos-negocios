export type Subscription = {
  id: number;
  app_hash: string;
  app_name?: string | null;
  plan_price_id: number;
  plan_name?: string | null;
  period?: string | null;
  price?: number | null;
  start_at: string | null;
  expires_at: string | null;
  status: string;
};
