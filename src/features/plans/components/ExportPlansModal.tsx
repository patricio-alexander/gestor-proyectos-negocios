"use client";

import { useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
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
      : plans.filter((p) => p.app_id === filterAppId);

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
      filterAppId === "all" ? plans : plans.filter((p) => p.app_id === filterAppId);
    const rows = targetPlans.map((plan) => {
      const monthly = plan.prices?.find((p) => p.period === "MONTHLY")?.price;
      const annual = plan.prices?.find((p) => p.period === "ANNUALLY")?.price;
      const modules = plan.plan_modules ?? [];
      const offers = plan.plan_offers ?? [];

      return [
        plan.name || "Sin nombre",
        plan.app_name || "—",
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
        ["Plan", "Aplicación", "Mensual", "Anual", "Módulos", "Ofertas"],
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
                    <select
                      value={filterAppId}
                      onChange={(e) =>
                        setFilterAppId(
                          e.target.value === "all" ? "all" : Number(e.target.value),
                        )
                      }
                      className="gp-select max-w-64 text-sm"
                    >
                      <option value="all">Todas las aplicaciones</option>
                      {apps.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-zinc-500">
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

                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Plan
                        </th>
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Aplicación
                        </th>
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Mensual
                        </th>
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Anual
                        </th>
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Módulos
                        </th>
                        <th className="px-4 py-3 font-semibold text-zinc-700">
                          Ofertas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-zinc-400"
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
                              className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${
                                i % 2 === 1 ? "bg-zinc-50/50" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-zinc-900">
                                {plan.name || "Sin nombre"}
                              </td>
                              <td className="px-4 py-3 text-zinc-600">
                                {plan.app_name || "—"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                                {formatPlanPrice(monthly?.price) ?? "—"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                                {formatPlanPrice(annual?.price) ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {modules.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {modules.map((m) => (
                                      <span
                                        key={m.id}
                                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                      >
                                        {m.module_name}
                                        {m.is_trial && (
                                          <span className="rounded bg-amber-200 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-amber-800">
                                            Trial
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {offers.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {offers.map((o) => (
                                      <span
                                        key={o.offer_id}
                                        className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                                      >
                                        {o.offer_name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400">—</span>
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
