"use client";

import { Button, Card } from "@heroui/react";
import Key from "@gravity-ui/icons/Key";
import TrashBin from "@gravity-ui/icons/TrashBin";
import type { ApiKey } from "../types";
import { gp } from "@/src/shared/ui/theme";
import { StatusBadge } from "@/src/shared/components/StatusBadge";
import { formatDate } from "@/src/shared/utils/format-display";

type ApiKeyCardProps = {
  apiKey: ApiKey;
  onRevoke: (key: ApiKey) => void;
  revoking?: boolean;
};

export function ApiKeyCard({ apiKey, onRevoke, revoking }: ApiKeyCardProps) {
  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div
        className="h-1 shrink-0"
        style={{
          background: apiKey.active
            ? "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))"
            : "var(--gp-border)",
        }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <Key width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
                {apiKey.name}
              </h3>
              <span className={`${gp.badge} mt-1.5 inline-block`}>
                {apiKey.business_name}
              </span>
            </div>
          </div>
          <StatusBadge
            label={apiKey.active ? "Activa" : "Revocada"}
            tone={apiKey.active ? "success" : "danger"}
          />
        </div>

        <div
          className="mt-4 rounded-xl border px-3 py-3"
          style={{
            borderColor: "var(--gp-card-border)",
            backgroundColor: "var(--gp-surface-muted)",
          }}
        >
          <p className="text-xs font-medium text-[var(--gp-text-muted)]">
            Prefijo
          </p>
          <code className="mt-1 block font-mono text-sm text-[var(--gp-text)]">
            {apiKey.prefix}…
          </code>
        </div>

        <p className="mt-4 flex-1 text-xs text-[var(--gp-text-muted)]">
          Creada {formatDate(apiKey.created_at)}
        </p>

        {apiKey.active && (
          <div
            className="mt-4 border-t pt-4"
            style={{ borderColor: "var(--gp-border)" }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-red-500"
              isDisabled={revoking}
              onPress={() => onRevoke(apiKey)}
            >
              <TrashBin width={14} height={14} />
              Revocar key
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
