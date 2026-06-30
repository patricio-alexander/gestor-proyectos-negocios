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
    title: "General",
    items: [
      { label: "Inicio", href: "/dashboard" },
      { label: "Mi perfil", href: "/dashboard/profile" },
      { label: "Notificaciones", href: "/dashboard/notifications" },
    ],
  },
  {
    title: "Acceso",
    items: [
      { label: "Usuarios", href: "/dashboard/access/users" },
      { label: "Roles", href: "/dashboard/access/roles" },
      { label: "Cuentas", href: "/dashboard/accounts" },
    ],
  },
  {
    title: "Licencias",
    items: [
      { label: "Negocios", href: "/dashboard/businesses" },
      { label: "Planes", href: "/dashboard/plans" },
      { label: "Suscripciones", href: "/dashboard/subscriptions" },
      { label: "Licencias", href: "/dashboard/licenses" },
      { label: "API Keys", href: "/dashboard/api-keys" },
    ],
  },
];
