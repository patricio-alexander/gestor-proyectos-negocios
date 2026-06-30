import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  createUser,
  getUserById,
  listUsers,
} from "@/src/features/access/lib/access-service";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await listUsers());
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener usuarios");
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.username?.trim()) {
      return NextResponse.json(
        { error: "El nombre de usuario es obligatorio" },
        { status: 400 },
      );
    }
    if (!body.password?.trim()) {
      return NextResponse.json(
        { error: "La contraseña es obligatoria" },
        { status: 400 },
      );
    }
    const user = await createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear usuario");
  }
}
