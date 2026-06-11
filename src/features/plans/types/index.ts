export type PlanPrice = {
  id: number;
  price: number | null;
  period: "MONTHLY" | "ANNUALLY";
};

export type PlanModule = {
  id: number;
  module_id: number;
  module_name?: string | null;
};

export type Plan = {
  id: number;
  name: string | null;
  business_id: number;
  business_name?: string | null;
  prices: PlanPrice[];
  modules: PlanModule[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreatePlanInput = {
  name: string;
  business_id: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  module_ids?: number[];
};

export type UpdatePlanInput = {
  name?: string;
  business_id?: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  module_ids?: number[];
};
