export type Section = {
  id: number;
  name: string;
  module_id: number;
  key: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Module = {
  id: number;
  name: string;
  key: string;
  business_id: number;
  description: string | null;
  is_active: boolean;
  business_name?: string | null;
  secciones: Section[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateModuleInput = {
  name: string;
  business_id: number;
};

export type UpdateModuleInput = {
  name?: string;
  description?: string | null;
  is_active?: boolean;
};

export type CreateSectionInput = {
  name: string;
  module_id: number;
};
