export type AppSectionRecord = {
  id: number;
  app_module_id: number;
  key: string;
  name: string;
  route_path: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type AppModuleRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  app_target: string;
  is_active: boolean;
  sections: AppSectionRecord[];
};

export type CreateAppModuleInput = {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
};

export type UpdateAppModuleInput = Partial<CreateAppModuleInput> & { is_active?: boolean };

export type CreateAppSectionInput = {
  app_module_id: number;
  key: string;
  name: string;
  route_path?: string;
  description?: string;
  sort_order?: number;
};

export type UpdateAppSectionInput = Partial<Omit<CreateAppSectionInput, "app_module_id">> & {
  is_active?: boolean;
};
