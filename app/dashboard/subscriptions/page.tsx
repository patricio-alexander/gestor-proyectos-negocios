"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { useSubscriptions } from "@/src/features/subscriptions/hooks/useSubscriptions";
import type { Subscription } from "@/src/features/subscriptions/types";
import { useState } from "react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Ban from "@gravity-ui/icons/Ban";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `$${price}`;
}

export default function SubscriptionsPage() {
  const { subscriptions, loading, cancel } = useSubscriptions();
  const [canceling, setCanceling] = useState<Subscription | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cancelState = useOverlayState();

  function openCancel(sub: Subscription) {
    setCanceling(sub);
    setError("");
    cancelState.open();
  }

  async function handleCancel() {
    if (!canceling) return;
    setError("");
    setSubmitting(true);
    try {
      await cancel(canceling.id);
      cancelState.close();
      setCanceling(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="gp-page">
      <div className="flex items-center gap-3">
        <CreditCard width={24} height={24} className="text-zinc-700" />
        <h1 className="gp-title">Suscripciones</h1>
      </div>

      <p className="-mt-4 gp-subtitle">
        Las suscripciones se crean cuando un cliente activa una licencia en su
        proyecto. Una vez que la licencia es usada, se convierte en una
        suscripción activa y el plan comienza a regir.
      </p>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <CreditCard width={48} height={48} className="text-zinc-300" />
          <p className="gp-subtitle">
            No hay suscripciones registradas todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">Aplicación</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Plan</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Período</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Precio</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Inicio</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Vence</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-zinc-900">
                    {sub.business_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {sub.plan_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {sub.period === "MONTHLY" ? "Mensual" : "Anual"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatPrice(sub.price) || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(sub.start_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(sub.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : sub.status === "EXPIRED"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sub.status === "ACTIVE"
                        ? "Activa"
                        : sub.status === "EXPIRED"
                          ? "Vencida"
                          : "Cancelada"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => openCancel(sub)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Ban width={12} height={12} />
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal state={cancelState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px]">
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
                <p className="gp-subtitle">
                  ¿Estás seguro de que querés cancelar la suscripción de{" "}
                  <strong>{canceling?.business_name}</strong> (
                  {canceling?.plan_name})?
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
