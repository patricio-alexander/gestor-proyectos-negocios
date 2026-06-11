export type Module = {
  id: number;
  name: string | null;
  key: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateModuleInput = {
  name: string;
  key: string;
};

export type UpdateModuleInput = {
  name?: string;
  key?: string;
};
