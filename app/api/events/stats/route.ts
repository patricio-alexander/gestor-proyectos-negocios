import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { eventsByAppWithTypes } from "@/src/features/events/lib/events-service";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || undefined;
    const apps = await eventsByAppWithTypes(range);
    return NextResponse.json({ apps });
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener estadísticas");
  }
}
