import { redirect } from "next/navigation";

/** Backups vive en Configuración → pestaña Backups. */
export default function BackupsPage() {
  redirect("/dashboard/configuracion?tab=backups");
}
