export type ModuleRecord = {
  id: number;
  name: string;
};

export type CreateModuleInput = {
  name: string;
  business_id: number;
};

export type UpdateModuleInput = {
  name?: string;
};
