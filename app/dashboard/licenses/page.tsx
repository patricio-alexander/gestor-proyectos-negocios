"use client";

import { Button, Card, Spinner } from "@heroui/react";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import { useAllLicenses } from "@/src/features/licenses/hooks/useAllLicenses";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { gp } from "@/src/shared/ui/theme";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponible",
  USED: "Usada",
  REVOKED: "Revocada",
};

export default function LicensesPage() {
  const { licenses, loading, revoke } = useAllLicenses();

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <PageHeader title="Licencias" Icon={ShieldKeyhole} />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Periodo</th>
              <th>Clave</th>
              <th>Estado</th>
              <th>Pago</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={6} className={`py-8 text-center ${gp.subtitle}`}>
                  No hay licencias generadas
                </td>
              </tr>
            ) : (
              licenses.map((lic) => (
                <tr key={lic.id}>
                  <td>{lic.plan_name ?? `#${lic.plan_id}`}</td>
                  <td>{lic.period === "MONTHLY" ? "Mensual" : "Anual"}</td>
                  <td className="max-w-[200px] truncate font-mono text-xs">{lic.key}</td>
                  <td>{STATUS_LABEL[lic.status] ?? lic.status}</td>
                  <td>{lic.method_pay ?? "—"}</td>
                  <td>
                    {lic.status === "AVAILABLE" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: "var(--gp-danger)" }}
                        onPress={() => revoke(lic.id)}
                      >
                        Revocar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Card className={`${gp.card} px-4 py-3 text-sm ${gp.subtitle}`}>
        Generá nuevas licencias desde la sección Planes.
      </Card>
    </div>
  );
}
