"use client";

import { Dropdown } from "@heroui/react";
import Check from "@gravity-ui/icons/Check";
import ChevronDown from "@gravity-ui/icons/ChevronDown";
import type { LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "../types";

export { LIFECYCLE_STATUS_OPTIONS };

export const LIFECYCLE_STATUS_STYLE: Record<
  LifecycleStatus,
  { chip: string; dot: string }
> = {
  active: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  // Legacy: mismo look que mantenimiento
  development: {
    chip: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
  maintenance: {
    chip: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
  planned: {
    chip: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  developer: {
    chip: "border-sky-200 bg-sky-50 text-sky-900",
    dot: "bg-sky-500",
  },
};

type LifecycleStatusSelectProps = {
  value: LifecycleStatus;
  onChange: (status: LifecycleStatus) => void;
  "aria-label"?: string;
  size?: "sm" | "md";
  className?: string;
};

export function LifecycleStatusSelect({
  value,
  onChange,
  "aria-label": ariaLabel = "Estado",
  size = "sm",
  className = "",
}: LifecycleStatusSelectProps) {
  const status = normalizeLifecycleStatus(value);
  const style = LIFECYCLE_STATUS_STYLE[status];
  const pad = size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={ariaLabel}
        className={`inline-flex w-full min-w-0 items-center gap-2 rounded-lg border font-medium outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--gp-input-focus)] ${pad} ${style.chip} ${className}`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} />
        <span className="min-w-0 flex-1 truncate text-left">
          {LIFECYCLE_STATUS_LABELS[status]}
        </span>
        <ChevronDown width={12} height={12} className="shrink-0 opacity-60" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-[11.5rem]">
        <Dropdown.Menu
          aria-label={ariaLabel}
          onAction={(key) => onChange(String(key) as LifecycleStatus)}
        >
          {LIFECYCLE_STATUS_OPTIONS.map((option) => {
            const optionStyle = LIFECYCLE_STATUS_STYLE[option];
            return (
              <Dropdown.Item
                key={option}
                id={option}
                textValue={LIFECYCLE_STATUS_LABELS[option]}
              >
                <span className="flex w-full items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-full ${optionStyle.dot}`}
                  />
                  <span className="flex-1 text-sm">
                    {LIFECYCLE_STATUS_LABELS[option]}
                  </span>
                  {status === option ? (
                    <Check
                      width={14}
                      height={14}
                      className="shrink-0 text-[var(--gp-input-focus)]"
                    />
                  ) : null}
                </span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
