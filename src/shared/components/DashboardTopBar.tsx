"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Dropdown } from "@heroui/react";
import Person from "@gravity-ui/icons/Person";
import ArrowRightFromSquare from "@gravity-ui/icons/ArrowRightFromSquare";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import Bars from "@gravity-ui/icons/Bars";
import type { AuthUser } from "@/src/features/auth/types";
import { ThemeSwitcher } from "@/src/shared/components/ThemeSwitcher";
import { NotificationsPopover } from "@/src/shared/components/NotificationsPopover";
import { ChangeRoleDialog } from "@/src/shared/components/ChangeRoleDialog";
import { gp } from "@/src/shared/ui/theme";

type DashboardTopBarProps = {
  user: AuthUser;
  activeRoleName: string;
  activeRoleId: number | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
  onExpandSidebar: () => void;
  onChangeRole: (roleId: number) => void;
  onLogout: () => Promise<void>;
};

function displayLabel(user: AuthUser) {
  return user.display_name || user.username || user.email || "Usuario";
}

export function DashboardTopBar({
  user,
  activeRoleName,
  activeRoleId,
  sidebarOpen,
  sidebarWidth,
  onExpandSidebar,
  onChangeRole,
  onLogout,
}: DashboardTopBarProps) {
  const router = useRouter();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const label = displayLabel(user);
  const initial = label.charAt(0).toUpperCase();
  const hasMultipleRoles = (user.roles?.length ?? 0) > 1;

  return (
    <>
      <header
        className={gp.topbar}
        style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!sidebarOpen && (
            <button
              type="button"
              aria-label="Mostrar menú lateral"
              className={gp.iconTrigger}
              onClick={onExpandSidebar}
            >
              <Bars width={18} height={18} />
            </button>
          )}
          <h1 className="gp-topbar-title truncate">{activeRoleName}</h1>
        </div>

        <div className="flex items-center gap-1">
          <NotificationsPopover />
          <ThemeSwitcher />

          <span className={`${gp.subtitle} mx-1 hidden max-w-[140px] truncate sm:block`}>
            {label}
          </span>

          <Dropdown>
            <Dropdown.Trigger aria-label="Menú de usuario" className={gp.avatarTrigger}>
              <Avatar size="sm" style={{ backgroundColor: "var(--gp-avatar-bg)" }}>
                <Avatar.Fallback className="text-xs font-semibold text-white">
                  {initial}
                </Avatar.Fallback>
              </Avatar>
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="min-w-44">
              <Dropdown.Menu
                aria-label="Usuario"
                onAction={async (key) => {
                  if (key === "profile") router.push("/dashboard/profile");
                  if (key === "role") setRoleDialogOpen(true);
                  if (key === "logout") {
                    await onLogout();
                    router.push("/login");
                  }
                }}
              >
                <Dropdown.Item key="profile" id="profile" textValue="Perfil">
                  <span className="flex items-center gap-2">
                    <Person width={16} height={16} />
                    Perfil
                  </span>
                </Dropdown.Item>
                {hasMultipleRoles && (
                  <Dropdown.Item key="role" id="role" textValue="Cambiar rol">
                    <span className="flex items-center gap-2">
                      <ArrowsRotateRight width={16} height={16} />
                      Cambiar rol
                    </span>
                  </Dropdown.Item>
                )}
                <Dropdown.Item key="logout" id="logout" textValue="Cerrar sesión">
                  <span className="flex items-center gap-2">
                    <ArrowRightFromSquare width={16} height={16} />
                    Cerrar sesión
                  </span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>

      {hasMultipleRoles && (
        <ChangeRoleDialog
          open={roleDialogOpen}
          onClose={() => setRoleDialogOpen(false)}
          roles={user.roles}
          activeRoleId={activeRoleId}
          onSelect={onChangeRole}
        />
      )}
    </>
  );
}
