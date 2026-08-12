"use client";

import { useEffect } from "react";

/**
 * HeroUI toast / Next View Transitions a veces lanzan:
 * InvalidStateError: Transition was aborted because of invalid state
 * (pestaña en segundo plano, HMR stale, Strict Mode). Es benigno.
 */
export function ViewTransitionErrorGuard() {
  useEffect(() => {
    const isBenign = (reason: unknown) => {
      if (!reason || typeof reason !== "object") return false;
      const err = reason as { name?: string; message?: string };
      return (
        err.name === "InvalidStateError" &&
        typeof err.message === "string" &&
        /transition was aborted|invalid state|visibility state is hidden/i.test(
          err.message,
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
      if (isBenign(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
