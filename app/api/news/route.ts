import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  createNewsItem,
  isNewsKind,
  listNewsItems,
} from "@/src/features/news/lib/news-service";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await listNewsItems());
  } catch (err) {
    return serviceErrorResponse(err, "Error al listar noticias");
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const kind = body?.kind;
    const appIds = Array.isArray(body?.app_ids)
      ? body.app_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    if (!isNewsKind(kind)) {
      return NextResponse.json(
        { error: "kind inválido (portada|interior|breve|editorial|proximamente)" },
        { status: 400 },
      );
    }
    if (!appIds.length) {
      return NextResponse.json(
        { error: "Elegí al menos una app destino" },
        { status: 400 },
      );
    }

    const item = await createNewsItem({
      title,
      subtitle: body?.subtitle ?? null,
      body: body?.body ?? null,
      kind,
      sort_order: body?.sort_order,
      app_ids: appIds,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear noticia");
  }
}
