import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  createModule,
  listModules,
} from "@/src/features/catalog/lib/catalog-service";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await listModules());
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener módulos");
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.business_id) {
      return NextResponse.json(
        { error: "name y business_id son obligatorios" },
        { status: 400 },
      );
    }
    const module = await createModule(body);
    return NextResponse.json(module, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear módulo");
  }
}
