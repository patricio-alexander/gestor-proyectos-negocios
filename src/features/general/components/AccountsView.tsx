"use client";

import Passport from "@gravity-ui/icons/Passport";
import { UsersManager } from "@/src/features/access/components/UsersManager";

export function AccountsView() {
  return (
    <UsersManager
      title="Cuentas de acceso"
      description="Credenciales de login y roles asignados al panel del gestor."
      createLabel="Nueva cuenta"
      entityLabel="cuenta"
      Icon={Passport}
    />
  );
}
