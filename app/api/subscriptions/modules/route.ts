import { NextRequest, NextResponse } from "next/server";
import { validateKey } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  const apiKey = await validateKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const modules = await prisma.module.findMany();
    return NextResponse.json(modules);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener los módulos" }, { status: 500 });
  }
 
}