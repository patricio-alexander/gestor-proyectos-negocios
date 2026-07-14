import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser, validateKey } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import {
  createEvent,
  listEvents,
} from "@/src/features/events/lib/events-service";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("app_id")
      ? Number(searchParams.get("app_id"))
      : undefined;
    const range = searchParams.get("range") || undefined;
    return NextResponse.json(await listEvents(appId, range));
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener eventos");
  }
}

export async function POST(request: NextRequest) {
  const apiKey = await validateKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const body = await request.json();
    if (!body.type_key?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "type_key y name son obligatorios" },
        { status: 400 },
      );
    }
    await createEvent({
      app_id: apiKey.app_id,
      type_key: body.type_key,
      name: body.name,
      metadata: body.metadata,
    });
    return NextResponse.json(
      { captured: true, key: body.type_key },
      { status: 201 },
    );
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear evento");
  }
}
