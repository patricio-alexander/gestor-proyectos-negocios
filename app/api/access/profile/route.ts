import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { updateProfile } from "@/src/features/access/lib/access-service";

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const user = await updateProfile(auth.user.userId, await request.json());
    return NextResponse.json({ user });
  } catch (err) {
    return serviceErrorResponse(err, "Error al actualizar perfil");
  }
}
