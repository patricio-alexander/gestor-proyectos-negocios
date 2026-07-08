export type App = {
  id: number;
  hash: string;
  name: string | null;
  owner_name: string | null;
  phone: string | null;
  ruc: string | null;
  address: string | null;
  email: string | null;
  maintenance: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateAppInput = {
  name: string;
  owner_name?: string | null;
  phone?: string | null;
  ruc?: string | null;
  address?: string | null;
  email?: string | null;
  maintenance?: boolean;
};

export type UpdateAppInput = {
  name?: string;
  owner_name?: string | null;
  phone?: string | null;
  ruc?: string | null;
  address?: string | null;
  email?: string | null;
  maintenance?: boolean;
};
