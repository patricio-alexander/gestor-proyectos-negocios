export type ApiKey = {
  id: number;
  name: string;
  prefix: string;
  active: boolean;
  business_id: number;
  business_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateApiKeyInput = {
  name: string;
  app_id: number;
};
