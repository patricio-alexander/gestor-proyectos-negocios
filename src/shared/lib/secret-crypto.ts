import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Cifrado at-rest de secretos del gestor (entitlement_secret, api_key móvil).
 * Formato: v1:iv:tag:ciphertext (AES-256-GCM).
 * Clave derivada de GESTOR_SECRETS_KEY | JWT_SECRET | DATABASE_URL.
 */
function encryptionKey() {
  const secret =
    process.env.GESTOR_SECRETS_KEY ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL ||
    "gestor-dev-secrets-key";
  return createHash("sha256").update(secret).digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("v1:") && value.split(":").length === 4;
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Formato de secreto inválido");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Guarda cifrado; si ya viene en formato v1, no vuelve a cifrar. */
export function sealSecret(value: string | null | undefined): string | null {
  const trimmed = value?.trim() || "";
  if (!trimmed) return null;
  if (isEncryptedSecret(trimmed)) return trimmed;
  return encryptSecret(trimmed);
}

/** Devuelve plaintext (desencripta v1 o deja legacy). */
export function revealSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!isEncryptedSecret(value)) return value;
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Compara Bearer recibido con valor guardado (cifrado o legacy). */
export function secretMatchesStored(
  presented: string,
  stored: string | null | undefined,
): boolean {
  if (!presented || !stored) return false;
  if (!isEncryptedSecret(stored)) {
    return safeEqual(presented, stored);
  }
  const plain = revealSecret(stored);
  return Boolean(plain && safeEqual(presented, plain));
}
