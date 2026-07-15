export type AppKind = "template" | "deployment";

export type App = {
  id: number;
  hash: string;
  name: string | null;
  kind?: AppKind;
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
  entitlement_url?: string | null;
  entitlement_secret?: string | null;
  has_entitlement_secret?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subscription?: {
    id: number;
    status: string;
    start_at: string | null;
    expires_at: string | null;
    period: string;
  } | null;
  plan?: {
    id: number;
    name: string | null;
    modules_count: number;
    modules: { id: number; key: string; name: string }[];
  } | null;
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
  entitlement_url?: string | null;
  entitlement_secret?: string | null;
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
  entitlement_url?: string | null;
  entitlement_secret?: string | null;
};

export type PushEntitlementResult = {
  push_ok: boolean;
  push_skipped: boolean;
  push_error: string | null;
};
