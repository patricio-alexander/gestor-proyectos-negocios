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

export function useBackups() {
  const [main, setMain] = useState<BackupMainInfo | null>(null);
  const [stored, setStored] = useState<StoredBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/backups"));
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
      const res = await fetch(apiUrl("/api/backups/export"));
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
      const res = await fetch(apiUrl("/api/backups/export"), { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      await refresh();
      appToast.success("Backup guardado en el servidor");
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
      const res = await fetch(apiUrl("/api/backups/main/download"));
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

  async function importFromFile(file: File) {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch(apiUrl("/api/backups/import"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      await refresh();
      appToast.success("Base de datos restaurada", {
        description: `${data.totalRows ?? 0} filas importadas desde ${file.name}`,
      });
      return data;
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al importar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return {
    main,
    stored,
    loading,
    busy,
    refresh,
    exportAndDownload,
    saveOnly,
    downloadMain,
    downloadStored,
    importFromFile,
  };
}
