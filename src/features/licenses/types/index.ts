export type License = {
  id: number;
  plan_price_id: number;
  period: "MONTHLY" | "ANNUALLY";
  plan_name?: string | null;
  key: string | null;
  status: string;
  used_at: string | null;
  method_pay: "CASH" | "TRANSFER" | null;
};

export type CreateLicenseInput = {
  plan_id: number;
  period: "MONTHLY" | "ANNUALLY";
  method_pay?: "CASH" | "TRANSFER";
};
