"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Ban from "@gravity-ui/icons/Ban";
import Clock from "@gravity-ui/icons/Clock";
import { useCallback, useMemo, useState } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { Subscription } from "../types";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { formatDateTimeLocal } from "@/src/shared/utils/format-display";
import { SubscriptionCard } from "./SubscriptionCard";

const PAGE_SIZE = 9;

function matchesSubSearch(sub: Subscription, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [sub.app_name, sub.plan_name, sub.status, sub.period]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function SubscriptionsManager() {
  const { subscriptions, loading, cancel, update } = useSubscriptions();
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState<Subscription | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editState = useOverlayState();
  const cancelState = useOverlayState();

  const stats = useMemo(
    () => ({
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === "ACTIVE").length,
      expired: subscriptions.filter((s) => s.status === "EXPIRED").length,
      canceled: subscriptions.filter((s) => s.status === "CANCELED").length,
    }),
    [subscriptions],
  );

  const filterSubs = useCallback(
    (sub: Subscription, query: string) => matchesSubSearch(sub, query),
    [],
  );

  const { search, setSearch, page, setPage, paginated, total } =
    usePaginatedSearch(subscriptions, filterSubs, PAGE_SIZE);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const startAtRaw = form.get("start_at") as string;
      const expiresAtRaw = form.get("expires_at") as string;
      await update(editing.id, {
        start_at: startAtRaw ? new Date(startAtRaw).toISOString() : null,
        expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
      });
      editState.close();
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!canceling) return;
    setError("");
    setSubmitting(true);
    try {
      await cancel(canceling.id);
      cancelState.close();
      setCanceling(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <PageHeader
        title="Suscripciones"
        description="Se activan cuando un cliente usa una licencia. Controlá vigencia y estado desde aquí."
        Icon={CreditCard}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="Total" value={stats.total} />
        <StatCard
          icon={CircleCheck}
          label="Activas"
          value={stats.active}
          featured={stats.active > 0}
        />
        <StatCard icon={Clock} label="Vencidas" value={stats.expired} />
        <StatCard icon={Ban} label="Canceladas" value={stats.canceled} />
      </div>

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por app, plan o estado…"
        total={total}
        totalLabel="suscripciones"
      />

      {paginated.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <CreditCard width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <p className="text-sm font-medium text-[var(--gp-text)]">
            {search.trim()
              ? "Sin resultados"
              : "No hay suscripciones registradas"}
          </p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Se crean automáticamente al activar una licencia en la app cliente.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onEdit={(s) => {
                  setEditing(s);
                  setError("");
                  editState.open();
                }}
                onCancel={(s) => {
                  setCanceling(s);
                  setError("");
                  cancelState.open();
                }}
              />
            ))}
          </div>
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar suscripción</Modal.Heading>
              </Modal.Header>
              {editing && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <p className="text-sm text-[var(--gp-text-muted)]">
                      {editing.app_name} · {editing.plan_name}
                    </p>
                    <label className={gp.label}>
                      Fecha inicio
                      <input
                        type="datetime-local"
                        name="start_at"
                        defaultValue={formatDateTimeLocal(editing.start_at)}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Fecha vencimiento
                      <input
                        type="datetime-local"
                        name="expires_at"
                        defaultValue={formatDateTimeLocal(editing.expires_at)}
                        className={gp.input}
                      />
                    </label>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancelar
                    </Button>
                    <Button type="submit" isDisabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : "Guardar"}
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={cancelState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Cancelar suscripción</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Cancelar la suscripción de{" "}
                  <strong>{canceling?.app_name}</strong> ({canceling?.plan_name}
                  )?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Volver
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  isDisabled={submitting}
                  onPress={handleCancel}
                >
                  {submitting ? <Spinner size="sm" /> : "Cancelar suscripción"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
