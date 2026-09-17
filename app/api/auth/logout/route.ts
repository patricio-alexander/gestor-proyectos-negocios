import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const cookiePath = basePath || "/";

  res.cookies.set("token", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: cookiePath,
    maxAge: 0,
  });

  return res;
}
