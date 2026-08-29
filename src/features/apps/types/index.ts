export type AppKind = "template" | "deployment" | "mobile";

export type AppMobileSummary = {
  mobile_app_id: number;
  key: string;
  /** Plataformas vistas en dispositivos o releases activos. */
  platforms: Array<"android" | "ios">;
  device_count: number;
  /** Vistos en los últimos 15 minutos. */
  online_device_count: number;
};

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
  entitlement_secret_encrypted?: boolean;
  mobile?: AppMobileSummary | null;
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
  } | null;
  modules?: { id: number; key: string; name: string }[];
  /** Resumen de funciones del catálogo (con estado efectivo por app). */
  features?: {
    id: number;
    key: string;
    name: string;
    status: string;
  }[];
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

export type PushAppResult = {
  app_name: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
};

export type PushEntitlementResult = {
  push_ok: boolean;
  push_skipped: boolean;
  push_error: string | null;
  push_results?: PushAppResult[];
};
