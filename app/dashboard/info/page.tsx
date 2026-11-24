"use client";

import CircleInfo from "@gravity-ui/icons/CircleInfo";
import { GestorInfoPanel } from "@/src/features/system/components/GestorInfoPanel";
import { gp } from "@/src/shared/ui/theme";

export default function InfoPage() {
  return (
    <div className={`${gp.page} gap-6`}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[var(--gp-text-muted)]">
          <CircleInfo width={18} height={18} />
          <span className="text-xs font-medium uppercase tracking-wide">
            Sistema
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--gp-text)]">
          Información
        </h1>
        <p className="text-sm text-[var(--gp-text-muted)]">
          Versión de Raptor Solutions y verificación de actualizaciones desde
          git.
        </p>
      </header>

      <GestorInfoPanel />
    </div>
  );
}
