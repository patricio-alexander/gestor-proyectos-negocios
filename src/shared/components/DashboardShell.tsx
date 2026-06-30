"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Tachometer from "@gravity-ui/icons/Tachometer";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { DASHBOARD_NAV } from "@/src/shared/config/dashboard-nav";
import { NavIcon } from "@/src/shared/config/dashboard-nav-icons";
import { DashboardTopBar } from "@/src/shared/components/DashboardTopBar";
import { useSidebar } from "@/src/shared/hooks/useSidebar";
import { gp } from "@/src/shared/ui/theme";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, activeRole, activeRoleId, changeRole, logout } = useAuth();
  const { open: sidebarOpen, width: sidebarWidth, close: closeSidebar, expand: expandSidebar } =
    useSidebar();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className={`${gp.page} min-h-dvh items-center justify-center`}>
        <p className={gp.subtitle}>Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${gp.page} min-h-dvh items-center justify-center`}>
        <p className={gp.subtitle}>Redirigiendo…</p>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh">
      <aside
        className={`${gp.sidebar} ${sidebarOpen ? gp.sidebarOpen : gp.sidebarClosed}`}
        style={{ width: sidebarWidth }}
      >
        <div className={gp.sidebarHeader}>
          <Link href="/dashboard" className={gp.sidebarBrand} title="GestorPro">
            <span className={`${gp.iconBoxSm} gp-sidebar-logo`}>
              <Tachometer width={20} height={20} />
            </span>
            {sidebarOpen && (
              <span className="gp-sidebar-brand-text truncate">GestorPro</span>
            )}
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              aria-label="Ocultar menú lateral"
              className={gp.iconTrigger}
              onClick={closeSidebar}
            >
              <ChevronLeft width={18} height={18} />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 ${sidebarOpen ? "px-3" : "px-2"}`}>
          {DASHBOARD_NAV.map((group) => (
            <div key={group.title} className="mb-5 last:mb-0">
              {sidebarOpen && <p className={gp.navGroup}>{group.title}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarOpen ? undefined : item.label}
                      className={
                        active
                          ? `${gp.navItemActive} ${sidebarOpen ? "" : gp.navItemCollapsed}`
                          : `${gp.navItem} ${sidebarOpen ? "" : gp.navItemCollapsed}`
                      }
                    >
                      <NavIcon href={item.href} width={18} height={18} />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <DashboardTopBar
        user={user}
        activeRoleName={activeRole?.name ?? "Administrador"}
        activeRoleId={activeRoleId}
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        onExpandSidebar={expandSidebar}
        onChangeRole={changeRole}
        onLogout={handleLogout}
      />

      <main
        className={`${gp.main} flex min-h-dvh min-w-0 flex-col overflow-x-hidden transition-[margin-left,width] duration-200 ease-in-out`}
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        {children}
      </main>
    </div>
  );
}
