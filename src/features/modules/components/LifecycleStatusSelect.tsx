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
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
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
  hidden: {
    chip: "border-violet-200 bg-violet-50 text-violet-900",
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
        className={`border font-medium ${style.chip} ${busy ? "opacity-60" : ""}`}
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
