/** URL pública del gestor en producción. */
export const PRODUCTION_SITE_URL =
  "https://aplicaciones.marianosamaniego.edu.ec/raptorsolutions";

/** URL del sitio (override con NEXT_PUBLIC_SITE_URL). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL
).replace(/\/$/, "");
