"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import { DASHBOARD_NAV } from "@/src/shared/config/dashboard-nav";
import { NavIcon } from "@/src/shared/config/dashboard-nav-icons";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { gp } from "@/src/shared/ui/theme";

export default function DashboardPage() {
  const { user } = useAuth();
  const label = user?.display_name || user?.username || "Administrador";

  const quickLinks = DASHBOARD_NAV.flatMap((g) => g.items).filter(
    (item) => item.href !== "/dashboard",
  );

  return (
    <div className={gp.pageGap8}>
      <div>
        <h1 className={gp.titleLg}>Hola, {label}</h1>
        <p className={gp.subtitleBlock}>
          Panel de control para licencias EdDeli. Gestioná negocios, planes y acceso del equipo desde el menú lateral.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={gp.cardInteractive}>
              <span className={gp.iconBox}>
                <NavIcon href={item.href} width={20} height={20} />
              </span>
              <span className="font-medium" style={{ color: "var(--gp-text)" }}>
                {item.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
