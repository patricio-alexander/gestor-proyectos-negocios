import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { createAppSection } from "@/src/features/catalog/lib/catalog-service";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.app_module_id || !body.key?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "app_module_id, key y name son obligatorios" },
        { status: 400 },
      );
    }
    const section = await createAppSection(body);
    return NextResponse.json(section, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear sección");
  }
}
