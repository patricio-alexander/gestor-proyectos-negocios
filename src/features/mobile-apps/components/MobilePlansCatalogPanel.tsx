/**
 * Catálogo de planes channel=mobile (ChilePan, etc.).
 * Crear / editar / eliminar — independiente de los planes web.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Plus from "@gravity-ui/icons/Plus";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { Plan } from "@/src/features/plans/types";
import { appToast } from "@/src/shared/utils/app-toast";
import { apiUrl } from "@/src/utils/apiUrl";

function formatPrice(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

type MobileModule = { id: number; key: string; name: string };

type FormState = {
  name: string;
  price_monthly: string;
  price_annual: string;
  module_ids: number[];
};

const emptyForm = (): FormState => ({
  name: "",
  price_monthly: "0",
  price_annual: "0",
  module_ids: [],
});

export function MobilePlansCatalogPanel() {
  const { plans, loading, create, update, remove, refetch } = usePlans("mobile");
  const { apps } = useApps();
  const mobileAppIds = useMemo(
    () => apps.filter((a) => a.kind === "mobile").map((a) => a.id),
    [apps],
  );

  const [modules, setModules] = useState<MobileModule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const createModal = useOverlayState();
  const editModal = useOverlayState();
  const deleteModal = useOverlayState();
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  const loadModules = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/modules?channel=mobile"));
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.modules ?? []);
      setModules(
        list.map((m: { id: number; key: string; name: string }) => ({
          id: m.id,
          key: m.key,
          name: m.name,
        })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm(),
      module_ids: modules.map((m) => m.id),
    });
    createModal.open();
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    const monthly = plan.prices.find((p) => p.period === "MONTHLY");
    const annual = plan.prices.find((p) => p.period === "ANNUALLY");
    const ids = [
      ...new Set(plan.plan_modules.map((m) => m.module_id)),
    ];
    setForm({
      name: plan.name ?? "",
      price_monthly: String(monthly?.price ?? 0),
      price_annual: String(annual?.price ?? 0),
      module_ids: ids.length ? ids : modules.map((m) => m.id),
    });
    editModal.open();
  }

  function openDelete(plan: Plan) {
    setToDelete(plan);
    deleteModal.open();
  }

  function toggleModule(id: number) {
    setForm((prev) => ({
      ...prev,
      module_ids: prev.module_ids.includes(id)
        ? prev.module_ids.filter((x) => x !== id)
        : [...prev.module_ids, id],
    }));
  }

  async function handleSubmit(mode: "create" | "edit") {
    if (!form.name.trim()) {
      appToast.error("El nombre es obligatorio");
      return;
    }
    if (mobileAppIds.length === 0) {
      appToast.error("No hay apps móvil para asociar el plan");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        app_ids: mobileAppIds,
        price_monthly: Number(form.price_monthly) || 0,
        price_annual: Number(form.price_annual) || 0,
        module_ids: form.module_ids,
      };
      if (mode === "create") {
        await create(payload);
        appToast.success("Plan móvil creado");
        createModal.close();
      } else if (editing) {
        await update(editing.id, payload);
        appToast.success("Plan móvil actualizado");
        editModal.close();
      }
      await refetch();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setSubmitting(true);
    try {
      await remove(toDelete.id);
      appToast.success("Plan eliminado");
      deleteModal.close();
      setToDelete(null);
      await refetch();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  const formFields = (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block opacity-70">Nombre</span>
        <input
          className="w-full rounded-lg border border-[var(--gp-border)] bg-[var(--gp-input-bg)] px-3 py-2"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Plan Gratis"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block opacity-70">Mensual</span>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-[var(--gp-border)] bg-[var(--gp-input-bg)] px-3 py-2"
            value={form.price_monthly}
            onChange={(e) =>
              setForm((f) => ({ ...f, price_monthly: e.target.value }))
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block opacity-70">Anual</span>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-[var(--gp-border)] bg-[var(--gp-input-bg)] px-3 py-2"
            value={form.price_annual}
            onChange={(e) =>
              setForm((f) => ({ ...f, price_annual: e.target.value }))
            }
          />
        </label>
      </div>
      <div>
        <div className="mb-2 text-sm opacity-70">Módulos (mismo set por ahora)</div>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--gp-border)] p-2">
          {modules.length === 0 ? (
            <p className="text-xs opacity-60">Sin módulos mobile</p>
          ) : (
            modules.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.module_ids.includes(m.id)}
                  onChange={() => toggleModule(m.id)}
                />
                {m.name}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm opacity-70">
          Planes para apps móviles. Por defecto: Gratis, Pro y Socios (mismos
          módulos).
        </p>
        <Button
          size="sm"
          style={{
            backgroundColor: "var(--gp-primary)",
            color: "var(--gp-primary-text)",
          }}
          onPress={openCreate}
        >
          <Plus width={14} height={14} />
          Nuevo plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm opacity-70">
          No hay planes móviles. Creá uno o ejecutá{" "}
          <code className="text-xs">scripts/ensure-mobile-plans.ts</code>.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const monthly = plan.prices.find((p) => p.period === "MONTHLY");
            const annual = plan.prices.find((p) => p.period === "ANNUALLY");
            return (
              <div
                key={plan.id}
                className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-card)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-semibold">{plan.name}</div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="min-w-0 px-2"
                      onPress={() => openEdit(plan)}
                      aria-label="Editar"
                    >
                      <Pencil width={14} height={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="min-w-0 px-2"
                      onPress={() => openDelete(plan)}
                      aria-label="Eliminar"
                    >
                      <TrashBin width={14} height={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-1 text-sm opacity-70">
                  Mensual {formatPrice(monthly?.price)} · Anual{" "}
                  {formatPrice(annual?.price)}
                </div>
                {plan.plan_modules.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs opacity-70">
                    {[
                      ...new Map(
                        plan.plan_modules.map((m) => [m.module_id, m]),
                      ).values(),
                    ].map((m) => (
                      <li key={`${plan.id}-${m.module_id}`}>
                        · {m.module_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal.Backdrop
        isOpen={createModal.isOpen}
        onOpenChange={createModal.setOpen}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.Header>
              <Modal.Heading>Nuevo plan móvil</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{formFields}</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={createModal.close}>
                Cancelar
              </Button>
              <Button
                isDisabled={submitting}
                style={{
                  backgroundColor: "var(--gp-primary)",
                  color: "var(--gp-primary-text)",
                }}
                onPress={() => void handleSubmit("create")}
              >
                {submitting ? "Guardando…" : "Crear"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={editModal.isOpen}
        onOpenChange={editModal.setOpen}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.Header>
              <Modal.Heading>Editar plan móvil</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{formFields}</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={editModal.close}>
                Cancelar
              </Button>
              <Button
                isDisabled={submitting}
                style={{
                  backgroundColor: "var(--gp-primary)",
                  color: "var(--gp-primary-text)",
                }}
                onPress={() => void handleSubmit("edit")}
              >
                {submitting ? "Guardando…" : "Guardar"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.setOpen}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Eliminar plan</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm">
                ¿Eliminar <strong>{toDelete?.name}</strong>? Se puede recuperar
                desde BD (soft-delete).
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={deleteModal.close}>
                Cancelar
              </Button>
              <Button
                isDisabled={submitting}
                variant="danger"
                onPress={() => void handleDelete()}
              >
                Eliminar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
