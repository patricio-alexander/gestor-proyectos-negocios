import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/shared/lib/prisma";
import { signToken } from "@/src/shared/lib/jwt";
import type { LoginInput, LoginResponse } from "@/src/features/auth/types";

export async function POST(request: Request) {
  try {
    const { username, password }: LoginInput = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      username: user.username!,
      email: user.email,
    });

    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        username: user.username!,
        email: user.email,
      },
    };

    const res = NextResponse.json(response);

    res.cookies.set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
