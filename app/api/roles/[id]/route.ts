import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { deleteRole, updateRole } from "@/src/features/access/lib/access-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const role = await updateRole(Number(id), await request.json());
    return NextResponse.json(role);
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar rol");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await deleteRole(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serviceErrorResponse(err, "Error al eliminar rol");
  }
}
