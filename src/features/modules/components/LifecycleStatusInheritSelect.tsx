"use client";

import type { LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "../types";

type LifecycleStatusInheritSelectProps = {
  value: LifecycleStatus | null;
  inheritLabel: string;
  disabled?: boolean;
  busy?: boolean;
  "aria-label"?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function LifecycleStatusInheritSelect({
  value,
  inheritLabel,
  disabled,
  busy,
  "aria-label": ariaLabel = "Estado",
  onChange,
  className = "",
}: LifecycleStatusInheritSelectProps) {
  const hasOverride = value != null;
  const selectValue = hasOverride ? normalizeLifecycleStatus(value) : "__inherit__";

  return (
    <select
      className={`h-8 min-w-[130px] rounded-lg border px-2 text-xs ${className} ${
        disabled || busy
          ? "cursor-not-allowed opacity-50"
          : hasOverride
            ? "border-amber-300 bg-amber-50 font-semibold text-amber-900"
            : "border-[var(--gp-border)] bg-white text-[var(--gp-text-muted)]"
      }`}
      value={selectValue}
      disabled={disabled || busy}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="__inherit__">↳ {inheritLabel}</option>
      {LIFECYCLE_STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {LIFECYCLE_STATUS_LABELS[opt]}
        </option>
      ))}
    </select>
  );
}
