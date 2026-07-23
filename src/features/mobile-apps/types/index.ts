export type MobilePlatform = "ios" | "android";

export type MobileApp = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  api_key: string;
  /** Fila Apps (kind=mobile) para control de módulos/secciones. */
  app_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  releases_count?: number;
  active_releases?: {
    platform: MobilePlatform;
    version: string;
    mandatory: boolean;
  }[];
};

export type MobileAppRelease = {
  id: number;
  mobile_app_id: number;
  platform: MobilePlatform;
  version: string;
  bundle_path: string;
  mandatory: boolean;
  release_notes: string | null;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MobileDevice = {
  id: number;
  mobile_app_id: number;
  device_id: string;
  platform: MobilePlatform;
  app_version: string;
  latest_version: string | null;
  latest_version_seen: string | null;
  os_version: string | null;
  model: string | null;
  label: string | null;
  up_to_date: boolean | null;
  update_available: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type CreateMobileAppInput = {
  key: string;
  name: string;
  description?: string | null;
};

export type UpdateMobileAppInput = {
  name?: string;
  description?: string | null;
  regenerate_api_key?: boolean;
};

export type CreateMobileReleaseInput = {
  platform: MobilePlatform;
  version: string;
  bundle_path: string;
  mandatory?: boolean;
  release_notes?: string | null;
  activate?: boolean;
};

export type UpdateMobileReleaseInput = {
  mandatory?: boolean;
  release_notes?: string | null;
  activate?: boolean;
};

export type AppUpdateManifest = {
  version: string;
  bundleUrl: string;
  mandatory: boolean;
  platform: MobilePlatform;
  releaseNotes: string | null;
  appKey: string;
};
