"use client";

import { useRouter } from "next/navigation";
import { Avatar, Button } from "@heroui/react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import Briefcase from "@gravity-ui/icons/Briefcase";
import CreditCard from "@gravity-ui/icons/CreditCard";
import FileText from "@gravity-ui/icons/FileText";
import House from "@gravity-ui/icons/House";
import Key from "@gravity-ui/icons/Key";
import LayoutCells from "@gravity-ui/icons/LayoutCells";
import Person from "@gravity-ui/icons/Person";
import Tachometer from "@gravity-ui/icons/Tachometer";

const navItems = [
  { label: "Inicio", href: "/dashboard", Icon: House },
  { label: "Negocios", href: "/dashboard/businesses", Icon: Briefcase },
  { label: "Planes", href: "/dashboard/plans", Icon: FileText },
  { label: "Módulos", href: "/dashboard/modules", Icon: LayoutCells },
  { label: "Suscripciones", href: "/dashboard/subscriptions", Icon: CreditCard },
  { label: "API Keys", href: "/dashboard/api-keys", Icon: Key },
  { label: "Usuarios", href: "/dashboard/users", Icon: Person },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-dvh bg-zinc-50">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex items-center gap-2 border-b px-6 py-5">
          <Tachometer width={22} height={22} />
          <span className="text-base font-semibold text-zinc-900">
            GestorPro
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Icon width={18} height={18} />
              {label}
            </a>
          ))}
        </nav>

        <div className="border-t px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="bg-zinc-200">
                <Avatar.Fallback className="text-sm font-semibold text-zinc-700">
                  {user.username.charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
              <span className="text-sm font-medium text-zinc-700">
                {user.username}
              </span>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={handleLogout}
              aria-label="Cerrar sesión"
              className="text-zinc-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
