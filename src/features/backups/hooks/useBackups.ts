"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/backups"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al listar backups");
      setMain(data.main);
      setStored(data.stored ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al listar backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function exportAndDownload() {
    setError("");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function saveOnly() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/backups/export"), { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      await refresh();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function downloadMain() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/backups/main/download"));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No hay backup.json");
      }
      const blob = await res.blob();
      triggerBlobDownload(blob, "backup.json");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function downloadStored(filename: string) {
    setError("");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar");
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
    error,
    setError,
    refresh,
    exportAndDownload,
    saveOnly,
    downloadMain,
    downloadStored,
  };
}
