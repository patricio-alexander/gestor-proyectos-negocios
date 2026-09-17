"use client";

import { useEffect } from "react";

/**
 * HeroUI toast / Next View Transitions a veces lanzan:
 * InvalidStateError: Transition was aborted because of invalid state
 * (pestaña en segundo plano, HMR stale, Strict Mode, cerrar modal + toast).
 * Es benigno: lo silenciamos para que Next no muestre overlay rojo.
 */
export function ViewTransitionErrorGuard() {
  useEffect(() => {
    const isBenign = (reason: unknown) => {
      if (!reason) return false;
      if (typeof reason === "string") {
        return /transition was aborted|invalid state|visibility state is hidden/i.test(
          reason,
        );
      }
      if (typeof reason !== "object") return false;
      const err = reason as { name?: string; message?: string };
      const msg = String(err.message || "");
      return (
        err.name === "InvalidStateError" ||
        /transition was aborted|invalid state|visibility state is hidden/i.test(
          msg,
        )
      );
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isBenign(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (isBenign(event.error) || isBenign(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    // Capas que Next/Turbopack usan además de window
    window.addEventListener("unhandledrejection", onRejection, true);
    window.addEventListener("error", onError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection, true);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return null;
}
