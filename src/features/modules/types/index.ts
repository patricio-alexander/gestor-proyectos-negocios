export type Capability = {
  id: number;
  section_id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: number;
  name: string;
  module_id: number;
  key: string | null;
  max_records_limit: number | null;
  usage_count: number;
  capabilities?: Capability[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Module = {
  id: number;
  name: string;
  key: string;
  app_id: number;
  description: string | null;
  is_active: boolean;
  app_name?: string | null;
  sections: Section[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateModuleInput = {
  name: string;
  app_id: number;
};

export type UpdateModuleInput = {
  name?: string;
  description?: string | null;
  is_active?: boolean;
};

export type CreateSectionInput = {
  name: string;
  module_id: number;
  key?: string | null;
  max_records_limit?: number | null;
};

export type UpdateSectionInput = {
  name?: string;
  key?: string | null;
  max_records_limit?: number | null;
};

export type CreateCapabilityInput = {
  section_id: number;
  code: string;
  name: string;
};

export type UpdateCapabilityInput = {
  name?: string;
  is_active?: boolean;
};
