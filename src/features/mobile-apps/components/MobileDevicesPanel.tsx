"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { apiUrl } from "@/src/utils/apiUrl";
import type { MobilePlatform } from "../types";

export type MobileDeviceRow = {
  id: number;
  device_id: string;
  platform: MobilePlatform;
  app_version: string;
  latest_version: string | null;
  up_to_date: boolean | null;
  update_available: boolean;
  os_version: string | null;
  model: string | null;
  label: string | null;
  last_seen_at: string;
};

type Props = {
  mobileAppId: number;
};

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function MobileDevicesPanel({ mobileAppId }: Props) {
  const [devices, setDevices] = useState<MobileDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/mobile-apps/${mobileAppId}/devices`));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudieron cargar dispositivos");
      }
      setDevices((await res.json()) as MobileDeviceRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [mobileAppId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm opacity-70">
          Cada celular reporta su <code className="text-xs">device_id</code> y
          versión al chequear OTA / heartbeat.
        </p>
        <Button size="sm" variant="secondary" onPress={() => void refresh()}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : error ? (
        <p className="text-sm text-amber-700">{error}</p>
      ) : devices.length === 0 ? (
        <p className="text-sm opacity-70">
          Aún no hay dispositivos. Abre ChilePan (con OTA configurado) para que
          se registre automáticamente.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--gp-border)] text-xs uppercase opacity-60">
                <th className="px-2 py-2 font-semibold">Dispositivo</th>
                <th className="px-2 py-2 font-semibold">Plataforma</th>
                <th className="px-2 py-2 font-semibold">Versión</th>
                <th className="px-2 py-2 font-semibold">Estado</th>
                <th className="px-2 py-2 font-semibold">Última vez</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--gp-border)]/60"
                >
                  <td className="px-2 py-2.5">
                    <div className="font-medium">
                      {d.label || d.model || shortId(d.device_id)}
                    </div>
                    <div className="text-xs opacity-50 font-mono">
                      {shortId(d.device_id)}
                      {d.os_version ? ` · OS ${d.os_version}` : ""}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 capitalize">{d.platform}</td>
                  <td className="px-2 py-2.5">
                    <span className="font-mono">{d.app_version}</span>
                    {d.latest_version ? (
                      <span className="ml-1 text-xs opacity-50">
                        / {d.latest_version}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5">
                    {d.up_to_date === null ? (
                      <span className="rounded-full bg-[var(--gp-surface-muted)] px-2 py-0.5 text-xs text-[var(--gp-text-muted)]">
                        Sin release
                      </span>
                    ) : d.up_to_date ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                        Al día
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                        Desactualizado
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-xs opacity-70">
                    {fmtWhen(d.last_seen_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
