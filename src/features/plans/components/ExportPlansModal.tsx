"use client";

import { useState } from "react";
import { Button, Label, ListBox, Modal, Select, useOverlayState } from "@heroui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Plan } from "../types";
import { formatPlanPrice } from "../lib/format-plan-price";
import FileArrowDown from "@gravity-ui/icons/FileArrowDown";

type ExportPlansModalProps = {
  plans: Plan[];
  apps: { id: number; name: string | null }[];
};

export function ExportPlansModal({ plans, apps }: ExportPlansModalProps) {
  const state = useOverlayState();
  const [filterAppId, setFilterAppId] = useState<number | "all">("all");

  const filteredPlans =
    filterAppId === "all"
      ? plans
      : plans.filter(
          (p) =>
            p.app_ids?.includes(filterAppId) ||
            p.apps_using?.some((a) => a.id === filterAppId),
        );

  function handleDownloadPDF() {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    const date = new Date().toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const primary = [50, 50, 50];
    const accent = [99, 102, 241];

    const appLabel =
      filterAppId === "all"
        ? "Todas las aplicaciones"
        : apps.find((a) => a.id === filterAppId)?.name ?? "";

    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageW, 48, "F");

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 48, pageW, 3, "F");

    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text("Planes", 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(190);
    doc.text(appLabel, 14, 33);
    doc.text(date, pageW - 14, 33, { align: "right" });

    doc.setTextColor(60);

    const targetPlans =
      filterAppId === "all"
        ? plans
        : plans.filter(
            (p) =>
              p.app_ids.includes(filterAppId) ||
              p.apps_using?.some((a) => a.id === filterAppId),
          );
    const rows = targetPlans.map((plan) => {
      const monthly = plan.prices?.find((p) => p.period === "MONTHLY")?.price;
      const annual = plan.prices?.find((p) => p.period === "ANNUALLY")?.price;
      const modules = plan.plan_modules ?? [];
      const offers = plan.plan_offers ?? [];
      const appsLabel =
        plan.apps_count > 0
          ? `${plan.apps_count}: ${(plan.apps_using ?? [])
              .map((a) => a.name || "?")
              .join(", ")}`
          : "0 apps";

      return [
        plan.name || "Sin nombre",
        appsLabel,
        monthly != null ? `$${monthly.toLocaleString("es-PE")}` : "—",
        annual != null ? `$${annual.toLocaleString("es-PE")}` : "—",
        modules.length > 0
          ? modules.map((m) => `  • ${m.module_name}`).join("\n")
          : "—",
        offers.length > 0
          ? offers.map((o) => `  • ${o.offer_name}`).join("\n")
          : "—",
      ];
    });

    autoTable(doc, {
      startY: 62,
      head: [
        ["Plan", "Apps usando", "Mensual", "Anual", "Módulos", "Ofertas"],
      ],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [50, 50, 50],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [248, 248, 250],
      },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: "bold" },
        1: { cellWidth: 28 },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: "auto" },
        5: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setDrawColor(210, 210, 210);
        doc.line(
          14,
          doc.internal.pageSize.height - 14,
          pageW - 14,
          doc.internal.pageSize.height - 14,
        );

        doc.setFontSize(7);
        doc.setTextColor(160);
        doc.text(
          `Página ${data.pageNumber}`,
          pageW / 2,
          doc.internal.pageSize.height - 8,
          { align: "center" },
        );
      },
    });

    doc.save(`planes-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  return (
    <>
      <Button
        variant="secondary"
        onPress={state.open}
      >
        <FileArrowDown width={16} height={16} />
        Exportar
      </Button>

      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[95vw] max-w-[1000px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Exportar planes</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Select
                      aria-label="Filtrar por aplicación"
                      selectedKey={
                        filterAppId === "all" ? "all" : String(filterAppId)
                      }
                      onSelectionChange={(key) => {
                        if (!key) return;
                        setFilterAppId(
                          key === "all" ? "all" : Number(key),
                        );
                      }}
                      className="max-w-64"
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="all" textValue="Todas las aplicaciones">
                            Todas las aplicaciones
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          {apps.map((app) => (
                            <ListBox.Item
                              key={app.id}
                              id={String(app.id)}
                              textValue={app.name ?? `App ${app.id}`}
                            >
                              {app.name}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <p className="text-sm text-[var(--gp-text-muted)]">
                      {filteredPlans.length}{" "}
                      {filteredPlans.length === 1 ? "plan" : "planes"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={handleDownloadPDF}
                  >
                    <FileArrowDown width={14} height={14} />
                    Descargar PDF
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--gp-border)]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--gp-border)] bg-[var(--gp-table-head)]">
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Plan
                        </th>
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Apps usando
                        </th>
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Mensual
                        </th>
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Anual
                        </th>
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Módulos
                        </th>
                        <th className="px-4 py-3 font-semibold text-[var(--gp-text)]">
                          Ofertas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-[var(--gp-text-muted)]"
                          >
                            No hay planes para esta aplicación
                          </td>
                        </tr>
                      ) : (
                        filteredPlans.map((plan, i) => {
                          const monthly = plan.prices?.find(
                            (p) => p.period === "MONTHLY",
                          );
                          const annual = plan.prices?.find(
                            (p) => p.period === "ANNUALLY",
                          );
                          const modules = plan.plan_modules ?? [];
                          const offers = plan.plan_offers ?? [];
                          return (
                            <tr
                              key={plan.id}
                              className={`border-b border-[var(--gp-border)] transition-colors hover:bg-[var(--gp-surface-hover)] ${
                                i % 2 === 1 ? "bg-[var(--gp-surface-muted)]/40" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-[var(--gp-text)]">
                                {plan.name || "Sin nombre"}
                              </td>
                              <td className="px-4 py-3 text-[var(--gp-text-muted)]">
                                {plan.apps_count > 0
                                  ? `${plan.apps_count} · ${(plan.apps_using ?? [])
                                      .map((a) => a.name || "?")
                                      .join(", ")}`
                                  : "0 apps"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--gp-text)]">
                                {formatPlanPrice(monthly?.price) ?? "—"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--gp-text)]">
                                {formatPlanPrice(annual?.price) ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {modules.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {modules.map((m) => (
                                      <span
                                        key={m.id}
                                        className="inline-flex items-center gap-1 rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)]"
                                      >
                                        {m.module_name}
                                        {m.is_trial && (
                                          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-amber-800 dark:text-amber-200">
                                            Trial
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[var(--gp-text-faint)]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {offers.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {offers.map((o) => (
                                      <span
                                        key={o.offer_id}
                                        className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
                                      >
                                        {o.offer_name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[var(--gp-text-faint)]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
