/**
 * Parseo seguro de respuestas fetch (evita "Unexpected token '<'" ante 502 HTML).
 */

export type SafeJsonResult<T> =
  | { ok: true; status: number; data: T; text: string }
  | {
      ok: false;
      status: number;
      data: null;
      text: string;
      reason: "gateway" | "html" | "empty" | "not-json" | "parse" | "network";
      error: string;
    };

const GATEWAY = new Set([502, 503, 504]);

export function looksLikeHtml(text: string): boolean {
  const t = text.trimStart().slice(0, 32).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<");
}

export function isJsonContentType(res: Response): boolean {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  return ct.includes("application/json") || ct.includes("+json");
}

export async function readSafeJson<T = unknown>(
  res: Response,
): Promise<SafeJsonResult<T>> {
  let text = "";
  try {
    text = await res.text();
  } catch (e) {
    return {
      ok: false,
      status: res.status,
      data: null,
      text: "",
      reason: "network",
      error: e instanceof Error ? e.message : "No se pudo leer el body",
    };
  }

  if (GATEWAY.has(res.status)) {
    return {
      ok: false,
      status: res.status,
      data: null,
      text,
      reason: "gateway",
      error: `HTTP ${res.status} (servidor reiniciando)`,
    };
  }

  if (!text.trim()) {
    return {
      ok: false,
      status: res.status,
      data: null,
      text,
      reason: "empty",
      error: "Respuesta vacía",
    };
  }

  if (looksLikeHtml(text) || !isJsonContentType(res)) {
    // Si content-type no es JSON pero el body sí parsea, aceptamos.
    if (!looksLikeHtml(text)) {
      try {
        return {
          ok: true,
          status: res.status,
          data: JSON.parse(text) as T,
          text,
        };
      } catch {
        /* fall through */
      }
    }
    return {
      ok: false,
      status: res.status,
      data: null,
      text,
      reason: looksLikeHtml(text) ? "html" : "not-json",
      error: looksLikeHtml(text)
        ? "Respuesta HTML (no JSON)"
        : "Content-Type no es JSON",
    };
  }

  try {
    return {
      ok: true,
      status: res.status,
      data: JSON.parse(text) as T,
      text,
    };
  } catch (e) {
    return {
      ok: false,
      status: res.status,
      data: null,
      text,
      reason: "parse",
      error: e instanceof Error ? e.message : "JSON inválido",
    };
  }
}

/** true si el fallo es típico de reinicio PM2 / nginx. */
export function isRestartLikeFailure(
  result: SafeJsonResult<unknown> | null,
  err?: unknown,
): boolean {
  if (result) {
    if (
      result.reason === "gateway" ||
      result.reason === "html" ||
      result.reason === "empty" ||
      result.reason === "parse" ||
      result.reason === "not-json"
    ) {
      return true;
    }
    if (GATEWAY.has(result.status)) return true;
  }
  if (err instanceof TypeError) return true; // Failed to fetch
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (
      m.includes("failed to fetch") ||
      m.includes("network") ||
      m.includes("load failed") ||
      m.includes("unexpected token") ||
      m.includes("is not valid json") ||
      m.includes("unexpected end of json")
    ) {
      return true;
    }
  }
  return false;
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
