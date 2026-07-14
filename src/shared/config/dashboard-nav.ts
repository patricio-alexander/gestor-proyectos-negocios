export type DashboardNavItem = {
  label: string;
  href: string;
};

export type DashboardNavGroup = {
  title: string;
  items: DashboardNavItem[];
};

/** Navegación esencial del gestor (licencias + acceso). */
export const DASHBOARD_NAV: DashboardNavGroup[] = [
  {
    title: "Dashboard",
    items: [{ label: "Resumen general", href: "/dashboard" }],
  },
  {
    title: "General",
    items: [
      { label: "Mi perfil", href: "/dashboard/profile" },
      { label: "Notificaciones", href: "/dashboard/notifications" },
      { label: "Aplicaciones", href: "/dashboard/apps" },
    ],
  },
  {
    title: "Acceso",
    items: [
      { label: "Usuarios", href: "/dashboard/access/users" },
      { label: "Roles", href: "/dashboard/access/roles" },
    ],
  },
  {
    title: "Planes y Subscripciones",
    items: [
      { label: "Ofertas", href: "/dashboard/offers" },
      { label: "Planes", href: "/dashboard/plans" },
      { label: "Suscripciones", href: "/dashboard/subscriptions" },
      { label: "Módulos", href: "/dashboard/modules" },
    ],
  },
  {
    title: "Monitoreo",
    items: [{ label: "Eventos", href: "/dashboard/events" }],
  },
  {
    title: "Sistema",
    items: [{ label: "Backups JSON", href: "/dashboard/backups" }],
  },
];
