import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  deleteEventType,
  updateEventType,
} from "@/src/features/events/lib/event-types-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const type = await updateEventType(Number(id), await request.json());
    return NextResponse.json(type);
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar tipo de evento");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await deleteEventType(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as any).code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar: el tipo tiene eventos asociados" },
        { status: 409 },
      );
    }
    return serviceErrorResponse(err, "Error al eliminar tipo de evento");
  }
}
