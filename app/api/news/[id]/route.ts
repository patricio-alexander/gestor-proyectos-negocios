import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  getNewsItem,
  isNewsKind,
  publishNewsItem,
  softDeleteNewsItem,
  unpublishNewsItem,
  updateNewsItem,
} from "@/src/features/news/lib/news-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const item = await getNewsItem(id);
    if (!item) {
      return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener noticia");
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const body = await request.json();
    const action = String(body?.action || "").trim();

    if (action === "publish") {
      const result = await publishNewsItem(id);
      return NextResponse.json(result);
    }
    if (action === "unpublish") {
      const result = await unpublishNewsItem(id);
      return NextResponse.json(result);
    }

    const title = String(body?.title || "").trim();
    const kind = body?.kind;
    const appIds = Array.isArray(body?.app_ids)
      ? body.app_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    if (!isNewsKind(kind)) {
      return NextResponse.json({ error: "kind inválido" }, { status: 400 });
    }
    if (!appIds.length) {
      return NextResponse.json(
        { error: "Elegí al menos una app destino" },
        { status: 400 },
      );
    }

    const item = await updateNewsItem(id, {
      title,
      subtitle: body?.subtitle ?? null,
      body: body?.body ?? null,
      kind,
      sort_order: body?.sort_order,
      app_ids: appIds,
    });
    return NextResponse.json(item);
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar noticia");
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const push = await softDeleteNewsItem(id);
    return NextResponse.json({ ok: true, push });
  } catch (err) {
    return serviceErrorResponse(err, "Error al eliminar noticia");
  }
}
