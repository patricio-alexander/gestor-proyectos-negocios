import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login"];

const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://tudominio.com", // producción
  "http://localhost:3000", // NO BORRAR ES EL ORIGIN DE ESTE PROYECTO
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const origin = request.headers.get("origin");
  const isAllowed = allowedOrigins.includes(origin as string);
  const isApiRoute = pathname.includes("/api/");
  const response = NextResponse.next();

  if (isApiRoute && isAllowed && request.method === "OPTIONS") {
    response.headers.set("Access-Control-Allow-Origin", origin as string);

    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    return response;
  }

  if (isApiRoute && isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin as string);
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
  }

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
