export type ModuleRecord = {
  id: number;
  name: string;
  is_trial: boolean;
};

export type CreateModuleInput = {
  name: string;
};

export type UpdateModuleInput = {
  name?: string;
};
