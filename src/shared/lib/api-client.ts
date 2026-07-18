import { apiUrl } from "@/src/utils/apiUrl";

type ApiErrorBody = { error?: string; message?: string };

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), init);
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!res.ok) {
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }

  return body as T;
}

export async function fetchJsonVoid(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(apiUrl(path), init);
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;

  if (!res.ok) {
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }
}
