"use client";

import { ListBox, Select } from "@heroui/react";
import type { LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "../types";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";

const INHERIT_KEY = "__inherit__";

type LifecycleStatusInheritSelectProps = {
  value: LifecycleStatus | null;
  inheritLabel: string;
  disabled?: boolean;
  busy?: boolean;
  "aria-label"?: string;
  onChange: (value: string) => void;
  className?: string;
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
  const selectedKey = hasOverride ? normalizeLifecycleStatus(value) : INHERIT_KEY;
  const inheritText = `↳ ${inheritLabel}`;

  return (
    <Select
      aria-label={ariaLabel}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key) onChange(String(key));
      }}
      isDisabled={disabled || busy}
      className={`min-w-[130px] [&_[data-slot=trigger]]:h-8 [&_[data-slot=trigger]]:text-xs ${className}`}
    >
      <Select.Trigger
        className={
          disabled || busy
            ? "gp-status-select-trigger opacity-50"
            : hasOverride
              ? `gp-status-select-trigger border font-semibold ${LIFECYCLE_STATUS_STYLE[normalizeLifecycleStatus(value)].chip}`
              : "border border-[var(--gp-input-border)] bg-[var(--gp-input-bg)]"
        }
      >
        <Select.Value>
          {hasOverride ? (
            <StatusOptionLabel status={normalizeLifecycleStatus(value)} />
          ) : (
            <span className="text-[var(--gp-text-muted)]">{inheritText}</span>
          )}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={INHERIT_KEY} textValue={inheritText}>
            {inheritText}
            <ListBox.ItemIndicator />
          </ListBox.Item>
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
