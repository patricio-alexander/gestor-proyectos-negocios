"use client";

import { useCallback, useEffect, useState } from "react";
import { appToast } from "@/src/shared/utils/app-toast";
import { apiUrl } from "@/src/utils/apiUrl";

export type BackupMainInfo = {
  exists: boolean;
  filename: string;
  sizeBytes: number;
  sizeMB: number;
  modifiedAt: string | null;
  counts: Record<string, number>;
  totalRows: number;
};

export type StoredBackup = {
  filename: string;
  sizeBytes: number;
  sizeMB: number;
  modifiedAt: string;
};

export type ImportProgress = {
  phase: "idle" | "uploading" | "restoring" | "done" | "error";
  percent: number;
  label: string;
  chunk?: number;
  totalChunks?: number;
};

const CHUNK_BYTES = 2 * 1024 * 1024;

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fetchOpts(init?: RequestInit): RequestInit {
  return { credentials: "include", ...init };
}

export function useBackups() {
  const [main, setMain] = useState<BackupMainInfo | null>(null);
  const [stored, setStored] = useState<StoredBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    phase: "idle",
    percent: 0,
    label: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/backups"), fetchOpts());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al listar backups");
      setMain(data.main);
      setStored(data.stored ?? []);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al listar backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function exportAndDownload() {
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/backups/export"), fetchOpts());
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al exportar");
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename="?([^"]+)"?/.exec(cd);
      triggerBlobDownload(blob, match?.[1] || "backup-gestor.json");
      await refresh();
      appToast.success("Backup exportado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al exportar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function saveOnly() {
    setBusy(true);
    try {
      const res = await fetch(
        apiUrl("/api/backups/export"),
        fetchOpts({ method: "POST" }),
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      await refresh();
      const warnCount = Array.isArray(data.warnings) ? data.warnings.length : 0;
      appToast.success(
        warnCount
          ? `Backup guardado (${warnCount} tabla(s) omitida(s) — revisá migraciones)`
          : "Backup guardado en el servidor",
      );
      return data;
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function downloadMain() {
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/backups/main/download"), fetchOpts());
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No hay backup.json");
      }
      const blob = await res.blob();
      triggerBlobDownload(blob, "backup.json");
      appToast.success("Descarga iniciada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al descargar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function downloadStored(filename: string) {
    setBusy(true);
    try {
      const res = await fetch(
        apiUrl(`/api/backups/stored/${encodeURIComponent(filename)}/download`),
        fetchOpts(),
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo descargar");
      }
      const blob = await res.blob();
      triggerBlobDownload(blob, filename);
      appToast.success("Descarga iniciada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al descargar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  /**
   * Sube por chunks de 2MB (evita el corte de 10MB del middleware de Next)
   * y luego restaura la BD. Reporta progreso para la barra del modal.
   */
  async function importFromFile(file: File) {
    setBusy(true);
    setImportProgress({
      phase: "uploading",
      percent: 0,
      label: "Preparando subida…",
    });
    try {
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));
      const initRes = await fetch(
        apiUrl("/api/backups/upload/init"),
        fetchOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            totalSize: file.size,
            totalChunks,
          }),
        }),
      );
      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || "No se pudo iniciar la subida");
      }
      const uploadId = String(initData.uploadId);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_BYTES;
        const end = Math.min(file.size, start + CHUNK_BYTES);
        const blob = file.slice(start, end);
        const chunkRes = await fetch(
          apiUrl(
            `/api/backups/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&index=${i}`,
          ),
          fetchOpts({
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: blob,
          }),
        );
        const chunkData = await chunkRes.json().catch(() => ({}));
        if (!chunkRes.ok) {
          throw new Error(
            chunkData.error || `Error al subir parte ${i + 1}/${totalChunks}`,
          );
        }
        // 0–85% = subida
        const uploadPct = Math.round(((i + 1) / totalChunks) * 85);
        setImportProgress({
          phase: "uploading",
          percent: uploadPct,
          label: `Subiendo… ${i + 1}/${totalChunks}`,
          chunk: i + 1,
          totalChunks,
        });
      }

      setImportProgress({
        phase: "restoring",
        percent: 90,
        label: "Restaurando base de datos…",
        chunk: totalChunks,
        totalChunks,
      });

      const finRes = await fetch(
        apiUrl("/api/backups/upload/finalize"),
        fetchOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, restore: true }),
        }),
      );
      const data = await finRes.json();
      if (!finRes.ok) throw new Error(data.error || "Error al restaurar");

      setImportProgress({
        phase: "done",
        percent: 100,
        label: "Listo",
        chunk: totalChunks,
        totalChunks,
      });
      // Evitar InvalidStateError de View Transitions (toast/modal/refresh a la vez)
      await new Promise((r) => setTimeout(r, 120));
      await refresh();
      setTimeout(() => {
        appToast.success("Base de datos restaurada", {
          description: `${data.totalRows ?? 0} filas · ${file.name}`,
        });
      }, 80);
      return data;
    } catch (err) {
      setImportProgress({
        phase: "error",
        percent: 0,
        label: err instanceof Error ? err.message : "Error al importar",
      });
      setTimeout(() => {
        appToast.error(err instanceof Error ? err.message : "Error al importar");
      }, 80);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function importFromServerFile(filename: string) {
    setBusy(true);
    setImportProgress({
      phase: "restoring",
      percent: 40,
      label: "Restaurando desde servidor…",
    });
    try {
      const res = await fetch(
        apiUrl("/api/backups/import-from-server"),
        fetchOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            filename === "backup.json"
              ? { useMain: true }
              : { filename },
          ),
        }),
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setImportProgress({
        phase: "done",
        percent: 100,
        label: "Listo",
      });
      await new Promise((r) => setTimeout(r, 120));
      await refresh();
      setTimeout(() => {
        appToast.success("BD restaurada desde servidor", {
          description: `${data.totalRows ?? 0} filas · ${data.sourceName || filename}`,
        });
      }, 80);
      return data;
    } catch (err) {
      setImportProgress({
        phase: "error",
        percent: 0,
        label: err instanceof Error ? err.message : "Error al importar",
      });
      setTimeout(() => {
        appToast.error(err instanceof Error ? err.message : "Error al importar");
      }, 80);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function reloadFromMain() {
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/backups/reload"), fetchOpts({
        method: "POST",
      }));
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        totalRows?: number;
      };
      if (!res.ok) {
        throw new Error(data.error || data.message || "Error al recargar");
      }
      await refresh();
      appToast.success(
        `BD recargada desde backup.json · ${data.totalRows ?? 0} filas`,
      );
      return data;
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al recargar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  function resetImportProgress() {
    setImportProgress({ phase: "idle", percent: 0, label: "" });
  }

  return {
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
  };
}
