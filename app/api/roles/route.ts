import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  createRole,
  listRoles,
} from "@/src/features/access/lib/access-service";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await listRoles());
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener roles");
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.key?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "key y name son obligatorios" },
        { status: 400 },
      );
    }
    const role = await createRole(body);
    return NextResponse.json(role, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear rol");
  }
}
