"use client";

import Link from "next/link";
import { Alert, Card, Spinner } from "@heroui/react";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Ban from "@gravity-ui/icons/Ban";
import FileText from "@gravity-ui/icons/FileText";
import { useCallback, useMemo, useState } from "react";
import { useAllLicenses } from "../hooks/useAllLicenses";
import type { License } from "../types";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { LicenseCard } from "./LicenseCard";

const PAGE_SIZE = 9;

function matchesLicenseSearch(lic: License, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [lic.plan_name, lic.key, lic.status, lic.period]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function LicensesManager() {
  const { licenses, loading, revoke } = useAllLicenses();
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const stats = useMemo(
    () => ({
      total: licenses.length,
      available: licenses.filter((l) => l.status === "AVAILABLE").length,
      used: licenses.filter((l) => l.status === "USED").length,
      revoked: licenses.filter((l) => l.status === "REVOKED").length,
    }),
    [licenses],
  );

  const filterLicenses = useCallback(
    (lic: License, query: string) => matchesLicenseSearch(lic, query),
    [],
  );

  const { search, setSearch, page, setPage, paginated, total } =
    usePaginatedSearch(licenses, filterLicenses, PAGE_SIZE);

  async function handleRevoke(lic: License) {
    setError("");
    setRevokingId(lic.id);
    try {
      await revoke(lic.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al revocar");
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <PageHeader
        title="Licencias"
        description="Claves de activación generadas desde los planes. Al usarse, crean una suscripción."
        Icon={ShieldKeyhole}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShieldKeyhole} label="Total" value={stats.total} />
        <StatCard
          icon={CircleCheck}
          label="Disponibles"
          value={stats.available}
          featured={stats.available > 0}
        />
        <StatCard icon={FileText} label="Usadas" value={stats.used} />
        <StatCard icon={Ban} label="Revocadas" value={stats.revoked} />
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por plan, clave o estado…"
        total={total}
        totalLabel="licencias"
      />

      {paginated.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <ShieldKeyhole
            width={40}
            height={40}
            className="text-[var(--gp-text-faint)]"
          />
          <p className="text-sm font-medium text-[var(--gp-text)]">
            {search.trim() ? "Sin resultados" : "No hay licencias generadas"}
          </p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Creá licencias desde la sección{" "}
            <Link
              href="/dashboard/plans"
              className="font-medium text-[var(--gp-badge-text)] hover:underline"
            >
              Planes
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((lic) => (
              <LicenseCard
                key={lic.id}
                license={lic}
                onRevoke={handleRevoke}
                revoking={revokingId === lic.id}
              />
            ))}
          </div>
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <Card className={`${gp.card} px-4 py-3 text-sm ${gp.subtitle}`}>
        Tip: generá nuevas licencias desde cualquier plan en{" "}
        <Link
          href="/dashboard/plans"
          className="font-medium text-[var(--gp-badge-text)] hover:underline"
        >
          Planes → Crear licencia
        </Link>
        .
      </Card>
    </div>
  );
}
