export type App = {
  id: number;
  hash: string;
  name: string | null;
  owner_name: string | null;
  phone: string | null;
  ruc: string | null;
  address: string | null;
  email: string | null;
  path: string | null;
  database_name: string | null;
  images_size: number | null;
  database_size: number | null;
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
  path?: string | null;
  database_name?: string | null;
  images_size?: number | null;
  database_size?: number | null;
  maintenance?: boolean;
};

export type UpdateAppInput = {
  name?: string;
  owner_name?: string | null;
  phone?: string | null;
  ruc?: string | null;
  address?: string | null;
  email?: string | null;
  path?: string | null;
  database_name?: string | null;
  images_size?: number | null;
  database_size?: number | null;
  maintenance?: boolean;
};
