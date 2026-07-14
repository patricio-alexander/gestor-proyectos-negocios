"use client";

import type { LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
} from "../types";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";

export type ModuleStatusFilterValue = (typeof LIFECYCLE_STATUS_OPTIONS)[number] | "all";

type ModuleStatusFilterProps = {
  value: ModuleStatusFilterValue;
  onChange: (value: ModuleStatusFilterValue) => void;
  counts: Record<ModuleStatusFilterValue, number>;
};

const FILTERS: { value: ModuleStatusFilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  ...LIFECYCLE_STATUS_OPTIONS.map((value) => ({
    value,
    label: LIFECYCLE_STATUS_LABELS[value],
  })),
];

export function ModuleStatusFilter({
  value,
  onChange,
  counts,
}: ModuleStatusFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((filter) => {
        const selected = value === filter.value;
        const count = counts[filter.value] ?? 0;
        const accent =
          filter.value === "all"
            ? "border-[var(--gp-input-border)] bg-[var(--gp-surface-muted)] text-[var(--gp-text)]"
            : LIFECYCLE_STATUS_STYLE[filter.value as LifecycleStatus].chip;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              selected
                ? `${accent} ring-1 ring-[var(--gp-input-focus)]`
                : "border-transparent bg-transparent text-[var(--gp-text-muted)] hover:bg-[var(--gp-surface-muted)]"
            }`}
            aria-pressed={selected}
          >
            {filter.value !== "all" ? (
              <span
                className={`size-1.5 rounded-full ${LIFECYCLE_STATUS_STYLE[filter.value as LifecycleStatus].dot}`}
              />
            ) : null}
            <span>{filter.label}</span>
            <span
              className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                selected
                  ? "bg-white/55 text-inherit"
                  : "bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
