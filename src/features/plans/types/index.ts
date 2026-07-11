export type PlanPrice = {
  id: number;
  price: number | null;
  period: "MONTHLY" | "ANNUALLY";
};

export type PlanModule = {
  id: number;
  module_id: number;
  module_name: string;
  is_trial: boolean;
};

export type PlanOffer = {
  offer_id: number;
  offer_name: string;
};

export type Plan = {
  id: number;
  name: string | null;
  app_id: number;
  app_name?: string | null;
  prices: PlanPrice[];
  plan_modules: PlanModule[];
  plan_offers: PlanOffer[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreatePlanInput = {
  name: string;
  app_id: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  module_ids?: number[];
  offer_ids?: number[];
};

export type UpdatePlanInput = {
  name?: string;
  app_id?: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  module_ids?: number[];
  offer_ids?: number[];
};
