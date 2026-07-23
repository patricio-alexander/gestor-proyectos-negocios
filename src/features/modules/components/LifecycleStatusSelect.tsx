"use client";

import { ListBox, Select } from "@heroui/react";
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
    chip: "border-emerald-500/30 !bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/35 dark:!bg-emerald-500/20 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  development: {
    chip: "border-red-500/30 !bg-red-500/15 text-red-800 dark:border-red-400/35 dark:!bg-red-500/20 dark:text-red-200",
    dot: "bg-red-500",
  },
  maintenance: {
    chip: "border-red-500/30 !bg-red-500/15 text-red-800 dark:border-red-400/35 dark:!bg-red-500/20 dark:text-red-200",
    dot: "bg-red-500",
  },
  planned: {
    chip: "border-amber-500/35 !bg-amber-500/15 text-amber-900 dark:border-amber-400/40 dark:!bg-amber-500/20 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  developer: {
    chip: "border-sky-500/30 !bg-sky-500/15 text-sky-900 dark:border-sky-400/35 dark:!bg-sky-500/20 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  hidden: {
    chip: "border-violet-500/30 !bg-violet-500/15 text-violet-900 dark:border-violet-400/35 dark:!bg-violet-500/20 dark:text-violet-200",
    dot: "bg-violet-500",
  },
};

type LifecycleStatusSelectProps = {
  value: LifecycleStatus;
  onChange: (status: LifecycleStatus) => void;
  "aria-label"?: string;
  size?: "sm" | "md";
  className?: string;
  busy?: boolean;
};

function StatusOptionLabel({ status }: { status: LifecycleStatus }) {
  const style = LIFECYCLE_STATUS_STYLE[status];
  return (
    <span className="flex items-center gap-2">
      <span className={`size-2 shrink-0 rounded-full ${style.dot}`} />
      <span>{LIFECYCLE_STATUS_LABELS[status]}</span>
    </span>
  );
}

export function LifecycleStatusSelect({
  value,
  onChange,
  "aria-label": ariaLabel = "Estado",
  size = "sm",
  className = "",
  busy,
}: LifecycleStatusSelectProps) {
  const status = normalizeLifecycleStatus(value);
  const style = LIFECYCLE_STATUS_STYLE[status];

  return (
    <Select
      aria-label={ariaLabel}
      selectedKey={status}
      onSelectionChange={(key) => {
        if (key) onChange(String(key) as LifecycleStatus);
      }}
      isDisabled={busy}
      className={`min-w-[118px] ${size === "sm" ? "[&_[data-slot=trigger]]:h-8 [&_[data-slot=trigger]]:text-xs" : ""} ${className}`}
    >
      <Select.Trigger
        className={`gp-status-select-trigger border font-medium ${style.chip} ${busy ? "opacity-60" : ""}`}
      >
        <Select.Value>
          <StatusOptionLabel status={status} />
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {LIFECYCLE_STATUS_OPTIONS.map((option) => (
            <ListBox.Item
              key={option}
              id={option}
              textValue={LIFECYCLE_STATUS_LABELS[option]}
            >
              <StatusOptionLabel status={option} />
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
