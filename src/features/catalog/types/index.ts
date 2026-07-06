export type ModuleRecord = {
  id: number;
  name: string;
  app_id: number;
};

export type CreateModuleInput = {
  name: string;
  app_id: number;
};

export type UpdateModuleInput = {
  name?: string;
};
