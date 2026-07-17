"use client";

import { toast } from "@heroui/react";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import TriangleExclamation from "@gravity-ui/icons/TriangleExclamation";

const ICON = 18;

type AppToastOptions = {
  description?: string;
};

function show(
  variant: "success" | "danger" | "warning",
  title: string,
  options?: AppToastOptions,
) {
  const indicator =
    variant === "success" ? (
      <CircleCheck width={ICON} height={ICON} />
    ) : variant === "warning" ? (
      <TriangleExclamation width={ICON} height={ICON} />
    ) : (
      <CircleExclamation width={ICON} height={ICON} />
    );

  toast[variant](title, {
    description: options?.description,
    indicator,
  });
}

/** Toasts HeroUI con iconos y variantes consistentes en todo el proyecto. */
export const appToast = {
  success(title: string, options?: AppToastOptions) {
    show("success", title, options);
  },
  error(title: string, options?: AppToastOptions) {
    show("danger", title, options);
  },
  warning(title: string, options?: AppToastOptions) {
    show("warning", title, options);
  },
};
