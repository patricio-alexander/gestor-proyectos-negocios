import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { publishAndPushAllNews } from "@/src/features/news/lib/news-service";

/** Publica todas las noticias con destino y las empuja a las apps. */
export async function POST() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const result = await publishAndPushAllNews();
    return NextResponse.json(result);
  } catch (err) {
    return serviceErrorResponse(err, "Error al enviar noticias a las apps");
  }
}
