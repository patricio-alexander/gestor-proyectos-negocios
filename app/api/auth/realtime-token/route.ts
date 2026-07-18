import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/src/shared/lib/api-auth";

/** Token JWT (cookie httpOnly) para autenticar la conexión Socket.IO del dashboard. */
export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
