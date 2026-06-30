import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  deleteAppSection,
  updateAppSection,
} from "@/src/features/catalog/lib/catalog-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const section = await updateAppSection(Number(id), await request.json());
    return NextResponse.json(section);
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar sección");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await deleteAppSection(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serviceErrorResponse(err, "Error al eliminar sección");
  }
}
