import { NextResponse } from "next/server";

export function serviceErrorResponse(err: unknown, fallback = "Error interno") {
  if (err instanceof Error) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json({ error: err.message }, { status: statusCode });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
