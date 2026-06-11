export type Business = {
  id: number;
  hash: string;
  name: string | null;
  owner_name: string | null;
  phone: string | null;
  ruc: string | null;
  address: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateBusinessInput = {
  name: string;
  owner_name?: string;
  phone?: string;
  ruc?: string;
  address?: string;
  email?: string;
};

export type UpdateBusinessInput = {
  name?: string;
  owner_name?: string;
  phone?: string;
  ruc?: string;
  address?: string;
  email?: string;
};
