import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  deleteUser,
  getUserById,
  updateUser,
} from "@/src/features/access/lib/access-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener el usuario");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const user = await updateUser(id, await request.json());
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar el usuario");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await deleteUser(id, auth.user.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serviceErrorResponse(err, "Error al eliminar el usuario");
  }
}
