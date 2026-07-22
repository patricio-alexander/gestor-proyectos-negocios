"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import ChevronDown from "@gravity-ui/icons/ChevronDown";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { DASHBOARD_NAV } from "@/src/shared/config/dashboard-nav";
import { NavIcon } from "@/src/shared/config/dashboard-nav-icons";
import { DashboardTopBar } from "@/src/shared/components/DashboardTopBar";
import { useSidebar } from "@/src/shared/hooks/useSidebar";
import { gp } from "@/src/shared/ui/theme";
import { assetUrl } from "@/src/utils/assetUrl";

const EYE_LOGO = assetUrl("/eye-logo-raptor-solutions.svg");

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, hrefs: string[]) {
  return hrefs.some((href) => isActive(pathname, href));
}

function initialOpenGroups(pathname: string) {
  const open = new Set<string>();
  for (const group of DASHBOARD_NAV) {
    if (groupHasActive(pathname, group.items.map((i) => i.href))) {
      open.add(group.title);
    }
  }
  if (open.size === 0 && DASHBOARD_NAV[0]) {
    open.add(DASHBOARD_NAV[0].title);
  }
  return open;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, activeRole, activeRoleId, changeRole, logout } =
    useAuth();
  const {
    open: sidebarOpen,
    width: sidebarWidth,
    close: closeSidebar,
    expand: expandSidebar,
  } = useSidebar();
  const [openGroups, setOpenGroups] = useState(() => initialOpenGroups(pathname));

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      for (const group of DASHBOARD_NAV) {
        if (groupHasActive(pathname, group.items.map((i) => i.href))) {
          next.add(group.title);
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

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
          <Link
            href="/dashboard"
            className={`${gp.sidebarBrand} ${sidebarOpen ? "" : "justify-center"}`}
            title="Raptor Solutions"
          >
            <img
              src={EYE_LOGO}
              alt=""
              aria-hidden
              className="h-7 w-7 shrink-0 object-contain"
            />
            {sidebarOpen && (
              <span className="gp-sidebar-brand-text truncate">Raptor</span>
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

        <nav
          className={`flex-1 overflow-y-auto py-3 ${sidebarOpen ? "px-3" : "px-2"}`}
        >
          {DASHBOARD_NAV.map((group) => {
            const expanded = openGroups.has(group.title);
            const sectionActive = groupHasActive(
              pathname,
              group.items.map((i) => i.href),
            );

            if (!sidebarOpen) {
              return (
                <div key={group.title} className="mb-3 space-y-0.5 last:mb-0">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={
                          active
                            ? `${gp.navItemActive} ${gp.navItemCollapsed}`
                            : `${gp.navItem} ${gp.navItemCollapsed}`
                        }
                      >
                        <NavIcon href={item.href} width={18} height={18} />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={group.title} className="mb-1.5 last:mb-0">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleGroup(group.title)}
                  className={`gp-nav-accordion-trigger flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
                    sectionActive ? "gp-nav-accordion-trigger-active" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{group.title}</span>
                  <ChevronDown
                    width={14}
                    height={14}
                    className={`shrink-0 transition-transform duration-200 ${
                      expanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pb-2 pt-0.5">
                      {group.items.map((item) => {
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={
                              active ? gp.navItemActive : gp.navItem
                            }
                          >
                            <NavIcon href={item.href} width={18} height={18} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
