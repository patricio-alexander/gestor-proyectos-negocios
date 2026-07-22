import { randomBytes } from "crypto";
import type { MobilePlatform } from "../types";

export function generateMobileApiKey(): string {
  return `ma_${randomBytes(16).toString("hex")}`;
}

export function normalizeAppKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSemverLike(version: string): boolean {
  return /^\d+\.\d+\.\d+([.-][a-zA-Z0-9.-]+)?$/.test(version.trim());
}

export function isMobilePlatform(value: unknown): value is MobilePlatform {
  return value === "ios" || value === "android";
}

/** Ruta pública relativa (con basePath se resuelve en el cliente/API). */
export function buildBundleRelativePath(
  appKey: string,
  platform: MobilePlatform,
  version: string,
  filename = "index.bundle",
): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "index.bundle";
  return `/bundles/mobile/${appKey}/${platform}/${version}/${safeName}`;
}
