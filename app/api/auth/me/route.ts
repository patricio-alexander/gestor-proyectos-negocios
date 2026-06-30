import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/src/shared/lib/jwt";
import { getUserById } from "@/src/features/access/lib/access-service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
