export type Section = {
  id: number;
  name: string;
  module_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Module = {
  id: number;
  name: string | null;
  key: string;
  business_id: number;
  business_name?: string | null;
  sections: Section[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateModuleInput = {
  name: string;
  key: string;
  business_id: number;
};

export type UpdateModuleInput = {
  name?: string;
  key?: string;
};
