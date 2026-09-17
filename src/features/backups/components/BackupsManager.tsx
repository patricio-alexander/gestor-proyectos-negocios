"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import ArrowDownToLine from "@gravity-ui/icons/ArrowDownToLine";
import ArrowRotateLeft from "@gravity-ui/icons/ArrowRotateLeft";
import ArrowUpFromSquare from "@gravity-ui/icons/ArrowUpFromSquare";
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

const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;

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

function previewBackupJson(raw: string) {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("El JSON debe ser un objeto con tablas");
  }
  const counts: Record<string, number> = {};
  let totalRows = 0;
  for (const [key, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) continue;
    counts[key] = value.length;
    totalRows += value.length;
  }
  if (totalRows === 0) {
    throw new Error("El JSON no contiene filas para importar");
  }
  return { counts, totalRows };
}

type BackupsManagerProps = {
  embedded?: boolean;
};

export function BackupsManager({ embedded = false }: BackupsManagerProps) {
  const {
    main,
    stored,
    loading,
    busy,
    importProgress,
    resetImportProgress,
    refresh,
    exportAndDownload,
    saveOnly,
    downloadMain,
    downloadStored,
    importFromFile,
    importFromServerFile,
    reloadFromMain,
  } = useBackups();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importState = useOverlayState();
  const reloadState = useOverlayState();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<{
    counts: Record<string, number>;
    totalRows: number;
  } | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewSkipped, setPreviewSkipped] = useState(false);

  const isImporting =
    importProgress.phase === "uploading" ||
    importProgress.phase === "restoring";

  async function onExport() {
    try {
      await exportAndDownload();
    } catch {
      /* toast en hook */
    }
  }

  async function onSave() {
    try {
      await saveOnly();
    } catch {
      /* toast en hook */
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreviewError("");
    setPendingFile(file);
    setPendingPreview(null);
    setPreviewSkipped(false);
    resetImportProgress();

    try {
      if (file.size > PREVIEW_MAX_BYTES) {
        setPreviewSkipped(true);
        importState.open();
        return;
      }
      const text = await file.text();
      setPendingPreview(previewBackupJson(text));
      importState.open();
    } catch (err) {
      setPendingFile(null);
      setPendingPreview(null);
      setPreviewError(
        err instanceof Error ? err.message : "No se pudo leer el archivo",
      );
      importState.open();
    }
  }

  async function confirmImport() {
    if (!pendingFile) return;
    try {
      await importFromFile(pendingFile);
    } catch {
      /* toast + progress error en hook */
    }
  }

  function cancelImport() {
    if (isImporting) return;
    importState.close();
    setPendingFile(null);
    setPendingPreview(null);
    setPreviewError("");
    setPreviewSkipped(false);
    resetImportProgress();
  }

  function closeImportDone() {
    importState.close();
    setPendingFile(null);
    setPendingPreview(null);
    setPreviewError("");
    setPreviewSkipped(false);
    resetImportProgress();
  }

  async function confirmReload() {
    try {
      await reloadFromMain();
      reloadState.close();
    } catch {
      /* toast */
    }
  }

  if (loading) {
    return (
      <div
        className={
          embedded
            ? "flex min-h-[40vh] items-center justify-center"
            : `${gp.page} items-center justify-center`
        }
      >
        <Spinner size="lg" />
      </div>
    );
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button isDisabled={busy} onPress={() => void refresh()}>
        <ArrowsRotateLeft width={16} height={16} />
        Actualizar
      </Button>
      <Button
        isDisabled={busy}
        variant="secondary"
        onPress={() => fileInputRef.current?.click()}
      >
        <ArrowUpFromSquare width={16} height={16} />
        Subir JSON
      </Button>
      <Button isDisabled={busy} onPress={() => void onSave()}>
        <FloppyDisk width={16} height={16} />
        Guardar en servidor
      </Button>
      <Button
        isDisabled={busy || !main?.exists}
        variant="secondary"
        onPress={() => reloadState.open()}
      >
        <ArrowRotateLeft width={16} height={16} />
        Recargar BD
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
  );

  return (
    <div className={embedded ? "flex flex-col gap-6" : gp.page}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      {embedded ? (
        <>
          <p className="text-sm text-[var(--gp-text-muted)]">
            Exporta / importa la BD del gestor. La subida va por partes (chunks)
            con barra de progreso — así no falla el límite de 10&nbsp;MB de Next.
          </p>
          {actions}
        </>
      ) : (
        <PageHeader
          title="Backups JSON"
          description="Subida por chunks con progreso. Export sin telemetría pesada."
          Icon={Database}
          action={actions}
        />
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
          Se actualiza al <strong>Exportar BD</strong>,{" "}
          <strong>Guardar en servidor</strong> o{" "}
          <strong>Subir JSON</strong>.{" "}
          <strong>Recargar BD</strong> restaura desde este archivo sin subir
          otro.
        </p>
        {main?.exists ? (
          <p className="mb-4 text-sm text-[var(--gp-text)]">
            {summaryLine(main.counts)} · {main.totalRows} filas ·{" "}
            {formatSize(main.sizeMB, main.sizeBytes)}
          </p>
        ) : (
          <Alert status="warning" className="mb-4">
            <Alert.Description>
              Todavía no hay backup.json. Exporta, guarda o sube un JSON.
            </Alert.Description>
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            isDisabled={!main?.exists || busy}
            onPress={() => void downloadMain()}
          >
            <ArrowDownToLine width={16} height={16} />
            Descargar backup.json
          </Button>
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() => fileInputRef.current?.click()}
          >
            <ArrowUpFromSquare width={16} height={16} />
            Restaurar desde JSON
          </Button>
          <Button
            variant="secondary"
            isDisabled={!main?.exists || busy}
            onPress={() => reloadState.open()}
          >
            <ArrowRotateLeft width={16} height={16} />
            Recargar BD
          </Button>
        </div>
      </div>

      <div className={gp.tableWrap}>
        <div className="border-b border-[var(--gp-border)] px-5 py-3">
          <h2 className={gp.titleLg}>Copias guardadas</h2>
          <p className="text-sm text-[var(--gp-text-muted)]">
            Cada export o import genera un archivo fechado en{" "}
            <code>backups/</code>.
          </p>
        </div>
        {stored.length === 0 ? (
          <p className={gp.empty}>
            No hay copias aún. Usa &quot;Exportar BD (JSON)&quot; o sube un
            backup.
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
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        isDisabled={busy}
                        onPress={() => void importFromServerFile(row.filename)}
                      >
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        isDisabled={busy}
                        onPress={() => void downloadStored(row.filename)}
                      >
                        Descargar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal state={importState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              {!isImporting && importProgress.phase !== "done" ? (
                <Modal.CloseTrigger />
              ) : null}
              <Modal.Header>
                <Modal.Heading>
                  {importProgress.phase === "done"
                    ? "Restauración completa"
                    : isImporting
                      ? "Subiendo y restaurando…"
                      : "Restaurar desde JSON"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                {previewError ? (
                  <Alert status="danger">
                    <Alert.Description>{previewError}</Alert.Description>
                  </Alert>
                ) : null}

                {importProgress.phase === "error" ? (
                  <Alert status="danger">
                    <Alert.Description>{importProgress.label}</Alert.Description>
                  </Alert>
                ) : null}

                {(isImporting || importProgress.phase === "done") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--gp-text-muted)]">
                        {importProgress.label || "Procesando…"}
                      </span>
                      <span className="font-mono tabular-nums">
                        {importProgress.percent}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--gp-border)]"
                      role="progressbar"
                      aria-valuenow={importProgress.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-300 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(0, importProgress.percent))}%`,
                          backgroundColor:
                            importProgress.phase === "done"
                              ? "#16a34a"
                              : "var(--gp-primary)",
                        }}
                      />
                    </div>
                    {importProgress.totalChunks ? (
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Parte {importProgress.chunk ?? 0} de{" "}
                        {importProgress.totalChunks}
                      </p>
                    ) : null}
                  </div>
                )}

                {!isImporting &&
                  importProgress.phase !== "done" &&
                  !previewError && (
                    <>
                      <Alert status="warning">
                        <Alert.Description>
                          Se borrarán <strong>todos los datos actuales</strong>{" "}
                          de la base de datos y se reemplazarán por el contenido
                          del archivo. Esta acción no se puede deshacer.
                        </Alert.Description>
                      </Alert>
                      {pendingFile && (
                        <p className="text-sm text-[var(--gp-text)]">
                          Archivo:{" "}
                          <span className="font-mono">{pendingFile.name}</span>
                          {" · "}
                          {formatSize(0, pendingFile.size)}
                        </p>
                      )}
                      {previewSkipped ? (
                        <p className="text-sm text-[var(--gp-text-muted)]">
                          Archivo grande: la vista previa se omite; se valida al
                          subir por partes.
                        </p>
                      ) : null}
                      {pendingPreview && (
                        <p className="text-sm text-[var(--gp-text-muted)]">
                          {summaryLine(pendingPreview.counts)} ·{" "}
                          {pendingPreview.totalRows} filas totales
                        </p>
                      )}
                    </>
                  )}
              </Modal.Body>
              <Modal.Footer>
                {importProgress.phase === "done" ? (
                  <Button onPress={closeImportDone}>Cerrar</Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      isDisabled={isImporting}
                      onPress={cancelImport}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      isDisabled={
                        busy ||
                        !!previewError ||
                        !pendingFile ||
                        isImporting
                      }
                      onPress={() => void confirmImport()}
                    >
                      {isImporting ? (
                        <Spinner size="sm" />
                      ) : (
                        "Restaurar y reemplazar"
                      )}
                    </Button>
                  </>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={reloadState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Recargar BD desde backup.json</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <Alert status="warning">
                  <Alert.Description>
                    Se reemplazará <strong>toda la base actual</strong> con el
                    contenido de <code>backups/backup.json</code> del servidor.
                    Tras el restore, los secretos se vuelven a cifrar en reposo.
                  </Alert.Description>
                </Alert>
                {main?.exists ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    {summaryLine(main.counts)} · {main.totalRows} filas ·{" "}
                    {formatSize(main.sizeMB, main.sizeBytes)}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={() => reloadState.close()}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  isDisabled={busy || !main?.exists}
                  onPress={() => void confirmReload()}
                >
                  {busy ? <Spinner size="sm" /> : "Recargar BD"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
