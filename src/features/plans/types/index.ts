export type PlanPrice = {
  id: number;
  price: number | null;
  period: "MONTHLY" | "ANNUALLY";
};

export type PlanModule = {
  id: number;
  app_module_id: number;
  module_name?: string | null;
  module_key?: string | null;
};

export type PlanSection = {
  id: number;
  app_section_id: number;
  section_name?: string | null;
  section_key?: string | null;
};

export type Plan = {
  id: number;
  name: string | null;
  business_id: number;
  business_name?: string | null;
  prices: PlanPrice[];
  modules: PlanModule[];
  sections: PlanSection[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreatePlanInput = {
  name: string;
  business_id: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  app_module_ids?: number[];
  app_section_ids?: number[];
};

export type UpdatePlanInput = {
  name?: string;
  business_id?: number;
  price_monthly?: number | null;
  price_annual?: number | null;
  app_module_ids?: number[];
  app_section_ids?: number[];
};
