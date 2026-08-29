import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { importNewsFromJson } from "@/src/features/news/lib/news-service";

/** Importa un lote JSON y reemplaza las noticias actuales. */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const items = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
        ? body.items
        : null;
    if (!items) {
      return NextResponse.json(
        { error: "JSON inválido: esperá un array o { items: [...] }" },
        { status: 400 },
      );
    }
    const defaultAppIds = Array.isArray(body?.default_app_ids)
      ? body.default_app_ids.map(Number).filter((n: number) => n > 0)
      : [];

    const result = await importNewsFromJson(items, defaultAppIds);
    return NextResponse.json(result);
  } catch (err) {
    return serviceErrorResponse(err, "Error al importar noticias");
  }
}
