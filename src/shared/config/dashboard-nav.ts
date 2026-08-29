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
    title: "Aplicaciones",
    items: [
      { label: "Todas", href: "/dashboard/apps" },
      { label: "Apps web", href: "/dashboard/kanban" },
      { label: "Apps móvil", href: "/dashboard/mobile-apps" },
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
    title: "Planes y suscripciones",
    items: [
      { label: "Ofertas", href: "/dashboard/offers" },
      { label: "Planes", href: "/dashboard/plans" },
      { label: "Suscripciones", href: "/dashboard/subscriptions" },
      { label: "Módulos", href: "/dashboard/modules" },
    ],
  },
  {
    title: "Monitoreo",
    items: [
      { label: "Eventos", href: "/dashboard/events" },
      { label: "Noticias", href: "/dashboard/news" },
    ],
  },
  {
    title: "Sistema",
    items: [{ label: "Configuración", href: "/dashboard/configuracion" }],
  },
];
