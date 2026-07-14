"use client";

import { Alert, Button, Spinner } from "@heroui/react";
import ArrowDownToLine from "@gravity-ui/icons/ArrowDownToLine";
import ArrowsRotateLeft from "@gravity-ui/icons/ArrowsRotateLeft";
import Clock from "@gravity-ui/icons/Clock";
import Database from "@gravity-ui/icons/Database";
import FloppyDisk from "@gravity-ui/icons/FloppyDisk";
import Layers from "@gravity-ui/icons/Layers";
import StarFill from "@gravity-ui/icons/StarFill";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { gp } from "@/src/shared/ui/theme";
import { useBackups } from "../hooks/useBackups";

function formatSize(mb: number, bytes: number) {
  if (mb >= 0.01) return `${mb} MB`;
  if (bytes > 0) return `${(bytes / 1024).toFixed(1)} KB`;
  return "—";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-EC");
  } catch {
    return iso;
  }
}

function summaryLine(counts: Record<string, number> | undefined) {
  if (!counts) return "";
  const users = counts.User ?? 0;
  const apps = counts.Apps ?? 0;
  const modules = counts.Module ?? 0;
  const subs = counts.Subscription ?? 0;
  return `${users} usuarios · ${apps} apps · ${modules} módulos · ${subs} suscripciones`;
}

export function BackupsManager() {
  const {
    main,
    stored,
    loading,
    busy,
    error,
    setError,
    refresh,
    exportAndDownload,
    saveOnly,
    downloadMain,
    downloadStored,
  } = useBackups();

  async function onExport() {
    try {
      await exportAndDownload();
    } catch {
      /* error ya en state */
    }
  }

  async function onSave() {
    try {
      await saveOnly();
    } catch {
      /* error ya en state */
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
        title="Backups JSON"
        description="Exporta la base de datos del gestor a JSON (como EdDeli). Guarda copias en el servidor y descárgalas."
        Icon={Database}
        action={
          <div className="flex flex-wrap gap-2">
            <Button isDisabled={busy} onPress={() => void refresh()}>
              <ArrowsRotateLeft width={16} height={16} />
              Actualizar
            </Button>
            <Button isDisabled={busy} onPress={() => void onSave()}>
              <FloppyDisk width={16} height={16} />
              Guardar en servidor
            </Button>
            <Button
              isDisabled={busy}
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
              onPress={() => void onExport()}
            >
              <ArrowDownToLine width={16} height={16} />
              Exportar BD (JSON)
            </Button>
          </div>
        }
      />

      {error && (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
          <Button size="sm" className="mt-2" onPress={() => setError("")}>
            Cerrar
          </Button>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Layers}
          label="Filas en backup fijo"
          value={main?.totalRows ?? 0}
          hint={summaryLine(main?.counts)}
        />
        <StatCard
          icon={Database}
          label="Tamaño backup.json"
          value={formatSize(main?.sizeMB ?? 0, main?.sizeBytes ?? 0)}
          hint={
            main?.exists
              ? `Actualizado ${formatDate(main.modifiedAt)}`
              : "Aún no hay backup fijo"
          }
        />
        <StatCard
          icon={Clock}
          label="Copias guardadas"
          value={stored.length}
          hint="Archivos backup-gestor-*.json"
        />
      </div>

      <div className={gp.cardPadded}>
        <div className="mb-3 flex items-center gap-2">
          <StarFill width={18} height={18} className="text-amber-400" />
          <h2 className={gp.titleLg}>backup.json (fijo)</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--gp-text-muted)]">
          Se actualiza al <strong>Exportar BD</strong> o{" "}
          <strong>Guardar en servidor</strong>. Queda en la carpeta{" "}
          <code>backups/</code> del proyecto.
        </p>
        {main?.exists ? (
          <p className="mb-4 text-sm text-[var(--gp-text)]">
            {summaryLine(main.counts)} · {main.totalRows} filas ·{" "}
            {formatSize(main.sizeMB, main.sizeBytes)}
          </p>
        ) : (
          <Alert status="warning" className="mb-4">
            <Alert.Description>
              Todavía no hay backup.json. Exporta o guarda desde la BD ahora.
            </Alert.Description>
          </Alert>
        )}
        <Button
          isDisabled={!main?.exists || busy}
          onPress={() => void downloadMain()}
        >
          <ArrowDownToLine width={16} height={16} />
          Descargar backup.json
        </Button>
      </div>

      <div className={gp.tableWrap}>
        <div className="border-b border-[var(--gp-border)] px-5 py-3">
          <h2 className={gp.titleLg}>Copias guardadas</h2>
          <p className="text-sm text-[var(--gp-text-muted)]">
            Cada export genera un archivo fechado en <code>backups/</code>.
          </p>
        </div>
        {stored.length === 0 ? (
          <p className={gp.empty}>
            No hay copias aún. Usa &quot;Exportar BD (JSON)&quot;.
          </p>
        ) : (
          <table className={gp.table}>
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Fecha</th>
                <th>Tamaño</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stored.map((row) => (
                <tr key={row.filename}>
                  <td className="font-mono text-xs">{row.filename}</td>
                  <td>{formatDate(row.modifiedAt)}</td>
                  <td>{formatSize(row.sizeMB, row.sizeBytes)}</td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      isDisabled={busy}
                      onPress={() => void downloadStored(row.filename)}
                    >
                      Descargar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
