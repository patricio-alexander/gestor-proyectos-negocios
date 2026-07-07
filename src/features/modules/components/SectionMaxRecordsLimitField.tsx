"use client";

import { useState, type ReactNode } from "react";
import { gp } from "@/src/shared/ui/theme";

const PRESETS = [100, 500, 1000, 5000] as const;

type SectionMaxRecordsLimitFieldProps = {
  defaultLimit?: number | null;
};

export function SectionMaxRecordsLimitField({
  defaultLimit = null,
}: SectionMaxRecordsLimitFieldProps) {
  const [enabled, setEnabled] = useState(defaultLimit != null);
  const [value, setValue] = useState(
    defaultLimit != null ? String(defaultLimit) : "500",
  );

  function selectPreset(preset: number) {
    setEnabled(true);
    setValue(String(preset));
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--gp-card-border)",
        backgroundColor: "var(--gp-surface-muted)",
      }}
    >
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--gp-text)]">
          Control remoto de registros
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--gp-text-muted)]">
          La app cliente consultará este límite al crear registros en esta
          sección.
        </p>
      </div>

      <input
        type="hidden"
        name="max_records_limit"
        value={enabled && value.trim() !== "" ? value : ""}
      />

      <div
        className="mb-4 inline-flex rounded-lg p-1"
        style={{ backgroundColor: "var(--gp-input-bg)" }}
        role="group"
        aria-label="Tipo de límite"
      >
        <LimitModeButton
          active={!enabled}
          onClick={() => setEnabled(false)}
        >
          Ilimitado
        </LimitModeButton>
        <LimitModeButton active={enabled} onClick={() => setEnabled(true)}>
          Con límite
        </LimitModeButton>
      </div>

      {enabled ? (
        <div className="space-y-3">
          <label className={gp.label}>
            Máximo de registros
            <input
              type="number"
              min={0}
              step={1}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={gp.input}
              placeholder="Ej: 500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--gp-text-muted)]">
              Sugeridos:
            </span>
            {PRESETS.map((preset) => {
              const active = value === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active
                      ? "var(--gp-badge-bg)"
                      : "var(--gp-input-bg)",
                    color: active
                      ? "var(--gp-badge-text)"
                      : "var(--gp-text-muted)",
                    border: `1px solid ${active ? "transparent" : "var(--gp-input-border)"}`,
                  }}
                >
                  {preset.toLocaleString("es-PE")}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--gp-text-muted)]">
          Sin restricción de cantidad de registros.
        </p>
      )}
    </div>
  );
}

function LimitModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? "var(--gp-card-bg)" : "transparent",
        color: active ? "var(--gp-text)" : "var(--gp-text-muted)",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}
