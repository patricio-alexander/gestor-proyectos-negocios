"use client";

import { Card } from "@heroui/react";
import Bell from "@gravity-ui/icons/Bell";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { gp } from "@/src/shared/ui/theme";

const PLACEHOLDER_ITEMS = [
  {
    title: "Licencia por vencer",
    body: "Alertas cuando una suscripción está próxima a expirar.",
  },
  {
    title: "Nueva suscripción activada",
    body: "Aviso cuando un negocio activa una licencia.",
  },
  {
    title: "API key revocada",
    body: "Registro de cambios en claves de acceso.",
  },
];

export function NotificationsView() {
  return (
    <div className={gp.page}>
      <PageHeader
        title="Notificaciones"
        description="Avisos del gestor sobre licencias, suscripciones y acceso."
        Icon={Bell}
      />

      <div className="grid gap-3">
        {PLACEHOLDER_ITEMS.map((item) => (
          <Card key={item.title} className={gp.cardPadded}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium" style={{ color: "var(--gp-text)" }}>
                  {item.title}
                </p>
                <p className={`mt-1 text-sm ${gp.subtitle}`}>{item.body}</p>
              </div>
              <span className={gp.badge}>Próximamente</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
