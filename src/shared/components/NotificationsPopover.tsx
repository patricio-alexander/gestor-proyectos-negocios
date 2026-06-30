"use client";

import Link from "next/link";
import { Popover } from "@heroui/react";
import Bell from "@gravity-ui/icons/Bell";
import { gp } from "@/src/shared/ui/theme";

const PREVIEW = [
  { title: "Licencia por vencer", time: "Próximamente" },
  { title: "Suscripción activada", time: "Próximamente" },
];

export function NotificationsPopover() {
  return (
    <Popover>
      <Popover.Trigger aria-label="Notificaciones" className={gp.iconTrigger}>
        <Bell width={18} height={18} />
      </Popover.Trigger>
      <Popover.Content placement="bottom end" className="w-80 p-0">
        <Popover.Dialog className="p-0">
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--gp-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
              Notificaciones
            </p>
          </div>
          <ul className="max-h-72 divide-y overflow-y-auto" style={{ borderColor: "var(--gp-border)" }}>
            {PREVIEW.map((item) => (
              <li key={item.title} className="px-4 py-3">
                <p className="text-sm font-medium" style={{ color: "var(--gp-text)" }}>
                  {item.title}
                </p>
                <p className={`${gp.subtitle} mt-0.5`}>{item.time}</p>
              </li>
            ))}
          </ul>
          <div className="border-t p-2 text-center" style={{ borderColor: "var(--gp-border)" }}>
            <Link href="/dashboard/notifications" className={`${gp.subtitle} font-medium hover:underline`}>
              Ver todas
            </Link>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
