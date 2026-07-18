import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { getKanbanBoardData } from "@/src/features/kanban/lib/kanban-query";

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const data = await getKanbanBoardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("kanban GET", err);
    return NextResponse.json(
      { error: "Error al cargar el tablero kanban" },
      { status: 500 },
    );
  }
}
