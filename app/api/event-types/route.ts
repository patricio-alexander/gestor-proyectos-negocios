import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { createEventType, listEventTypes } from "@/src/features/events/lib/event-types-service";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await listEventTypes());
  } catch (err) {
    return serviceErrorResponse(err, "Error al obtener tipos de evento");
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
    const type = await createEventType(body);
    return NextResponse.json(type, { status: 201 });
  } catch (err) {
    return serviceErrorResponse(err, "Error al crear tipo de evento");
  }
}
