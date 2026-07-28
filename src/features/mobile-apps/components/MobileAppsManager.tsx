"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  useOverlayState,
} from "@heroui/react";
import Smartphone from "@gravity-ui/icons/Smartphone";
import Plus from "@gravity-ui/icons/Plus";
import ArrowUpFromSquare from "@gravity-ui/icons/ArrowUpFromSquare";
import Copy from "@gravity-ui/icons/Copy";
import ArrowsRotateLeft from "@gravity-ui/icons/ArrowsRotateLeft";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { assetUrl } from "@/src/utils/assetUrl";
import { MobileAppModulesPanel } from "./MobileAppModulesPanel";
import { MobilePlansCatalogPanel } from "./MobilePlansCatalogPanel";
import { MobileDevicesPanel } from "./MobileDevicesPanel";
import type { MobileApp, MobilePlatform } from "../types";
import { useMobileApps, useMobileReleases } from "../hooks/useMobileApps";

type AppTab = "resumen" | "modulos" | "dispositivos" | "planes" | "releases";

const APP_TABS: { id: AppTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "modulos", label: "Módulos" },
  { id: "dispositivos", label: "Dispositivos" },
  { id: "releases", label: "Releases" },
  { id: "planes", label: "Planes" },
];

export function MobileAppsManager() {
  const { apps, loading, create, update, remove, refresh } = useMobileApps();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<AppTab>("resumen");
  const selected = useMemo(
    () => apps.find((a) => a.id === selectedId) ?? null,
    [apps, selectedId],
  );

  useEffect(() => {
    if (loading) return;
    if (apps.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !apps.some((a) => a.id === selectedId)) {
      setSelectedId(apps[0].id);
    }
  }, [apps, loading, selectedId]);

  const createState = useOverlayState();
  const [newKey, setNewKey] = useState("chilepan");
  const [newName, setNewName] = useState("ChilePan");
  const [newDesc, setNewDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    try {
      const app = await create({
        key: newKey,
        name: newName,
        description: newDesc || null,
      });
      appToast.success("App móvil creada");
      setSelectedId(app.id);
      setTab("resumen");
      createState.close();
      setNewKey("");
      setNewName("");
      setNewDesc("");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  }

  async function onRegenerateKey(app: MobileApp) {
    if (!confirm("¿Regenerar API key? La app móvil deberá usar la nueva clave.")) {
      return;
    }
    try {
      await update(app.id, { regenerate_api_key: true });
      appToast.success("API key regenerada");
      await refresh();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error");
    }
  }

  async function onDeleteApp(app: MobileApp) {
    if (!confirm(`¿Eliminar ${app.name}? Se ocultará del panel.`)) return;
    try {
      await remove(app.id);
      if (selectedId === app.id) setSelectedId(null);
      appToast.success("App eliminada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error");
    }
  }

  function copyText(label: string, value: string) {
    void navigator.clipboard.writeText(value);
    appToast.success(`${label} copiada`);
  }

  function selectApp(id: number) {
    setSelectedId(id);
    setTab("resumen");
  }

  return (
    <div className={gp.pageGap8}>
      <PageHeader
        title="Apps móvil"
        description="OTA, módulos y dispositivos del canal móvil."
        Icon={Smartphone}
        action={
          <Button onPress={createState.open}>
            <Plus width={16} height={16} />
            Nueva app
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : apps.length === 0 ? (
        <div className={`${gp.card} px-5 py-10 text-center text-sm opacity-70`}>
          Aún no hay apps móviles. Creá una para empezar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Selector de apps — horizontal arriba */}
          <div className={`${gp.card} flex flex-wrap items-center gap-1.5 p-2`}>
            {apps.map((app) => {
              const active = selectedId === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => selectApp(app.id)}
                  className={
                    active
                      ? "rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--gp-text)] shadow-sm"
                      : "rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-[var(--gp-text-muted)] hover:bg-[var(--gp-surface-muted)] hover:text-[var(--gp-text)]"
                  }
                  title={app.key}
                >
                  {app.name}
                  <span
                    className={
                      active
                        ? "ml-1.5 text-[10px] font-normal opacity-80"
                        : "ml-1.5 text-[10px] font-normal opacity-50"
                    }
                  >
                    {app.key}
                  </span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <>
              {/* Pestañas de la app */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[var(--gp-border)]">
                {APP_TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={
                        active
                          ? "-mb-px border-b-2 border-[var(--gp-text)] px-3 py-2 text-sm font-semibold text-[var(--gp-text)]"
                          : "px-3 py-2 text-sm font-medium text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <AppDetail
                app={selected}
                tab={tab}
                onCopy={copyText}
                onRegenerateKey={() => void onRegenerateKey(selected)}
                onDelete={() => void onDeleteApp(selected)}
                onReleasesChanged={() => void refresh()}
                onOpenUpload={() => setTab("releases")}
              />
            </>
          ) : null}
        </div>
      )}

      <Modal.Backdrop isOpen={createState.isOpen} onOpenChange={createState.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Nueva app móvil</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <label className={gp.label}>
                Clave (key)
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="chilepan"
                />
              </label>
              <label className={gp.label}>
                Nombre
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ChilePan"
                />
              </label>
              <label className={gp.label}>
                Descripción
                <TextArea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </label>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={createState.close}>
                Cancelar
              </Button>
              <Button onPress={() => void onCreate()} isDisabled={busy}>
                Crear
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

function AppDetail({
  app,
  tab,
  onCopy,
  onRegenerateKey,
  onDelete,
  onReleasesChanged,
  onOpenUpload,
}: {
  app: MobileApp;
  tab: AppTab;
  onCopy: (label: string, value: string) => void;
  onRegenerateKey: () => void;
  onDelete: () => void;
  onReleasesChanged: () => void;
  onOpenUpload: () => void;
}) {
  const {
    releases,
    loading,
    uploadRelease,
    activate,
    setMandatory,
    remove,
  } = useMobileReleases(app.id);

  const uploadState = useOverlayState();
  const [platform, setPlatform] = useState<MobilePlatform>("android");
  const [version, setVersion] = useState("1.0.0");
  const [notes, setNotes] = useState("");
  const [mandatory, setMandatoryFlag] = useState(false);
  const [activateOnUpload, setActivateOnUpload] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    if (!file) {
      appToast.warning("Selecciona el archivo bundle");
      return;
    }
    setBusy(true);
    try {
      await uploadRelease({
        file,
        platform,
        version,
        mandatory,
        activate: activateOnUpload,
        release_notes: notes || undefined,
      });
      onReleasesChanged();
      appToast.success(
        activateOnUpload ? "Release subido y activado" : "Release subido",
      );
      uploadState.close();
      setFile(null);
      setNotes("");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {tab === "resumen" ? (
        <div className={`${gp.cardPadded} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className={gp.titleLg}>{app.name}</h2>
              <p className={gp.subtitle}>key: {app.key}</p>
              {app.description ? (
                <p className="mt-1 text-sm opacity-80">{app.description}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  onOpenUpload();
                  uploadState.open();
                }}
              >
                <ArrowUpFromSquare width={14} height={14} />
                Subir release
              </Button>
              <Button size="sm" variant="secondary" onPress={onRegenerateKey}>
                <ArrowsRotateLeft width={14} height={14} />
                Regenerar key
              </Button>
              <Button size="sm" variant="danger" onPress={onDelete}>
                Eliminar
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface-2,transparent)] p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-60">
              API key (Bearer)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all text-xs sm:text-sm">{app.api_key}</code>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onCopy("API key", app.api_key)}
              >
                <Copy width={14} height={14} />
                Copiar
              </Button>
            </div>
            {app.app_id != null ? (
              <p className="mt-2 text-xs opacity-70">
                Control plane: Apps #{app.app_id}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-700">
                Sin vínculo al control de módulos. Recarga la lista.
              </p>
            )}
          </div>

          {app.active_releases && app.active_releases.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {app.active_releases.map((r) => (
                <span key={r.platform} className={gp.badge}>
                  {r.platform}: {r.version}
                  {r.mandatory ? " · obligatorio" : " · opcional"}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs opacity-60">Sin release activo aún.</p>
          )}
        </div>
      ) : null}

      {tab === "dispositivos" ? (
        <div className={gp.card}>
          <div className="border-b border-[var(--gp-border)] px-4 py-2.5">
            <h3 className="text-sm font-semibold">Dispositivos</h3>
          </div>
          <div className="p-4">
            <MobileDevicesPanel mobileAppId={app.id} />
          </div>
        </div>
      ) : null}

      {tab === "modulos" ? (
        app.app_id != null ? (
          <MobileAppModulesPanel
            controlAppId={app.app_id}
            appName={app.name}
          />
        ) : (
          <div className={`${gp.card} px-5 py-8 text-center text-sm opacity-70`}>
            Esta app aún no tiene control plane. Recargá la lista.
          </div>
        )
      ) : null}

      {tab === "planes" ? (
        <div className={gp.card}>
          <div className="border-b border-[var(--gp-border)] px-4 py-2.5">
            <h3 className="text-sm font-semibold">Planes móviles</h3>
            <p className="text-xs opacity-60">
              Catálogo channel=mobile (compartido entre apps móviles)
            </p>
          </div>
          <div className="p-4">
            <MobilePlansCatalogPanel />
          </div>
        </div>
      ) : null}

      {tab === "releases" ? (
        <div className={gp.card}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gp-border)] px-4 py-2.5">
            <h3 className="text-sm font-semibold">Historial de releases</h3>
            <Button size="sm" onPress={uploadState.open}>
              <ArrowUpFromSquare width={14} height={14} />
              Subir release
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : releases.length === 0 ? (
            <p className={gp.empty}>
              Sin releases. Subí el primer bundle (Android o iOS).
            </p>
          ) : (
            <div className={gp.tableWrap}>
              <table className={gp.table}>
                <thead>
                  <tr>
                    <th>Plataforma</th>
                    <th>Versión</th>
                    <th>Estado</th>
                    <th>Tipo</th>
                    <th>Bundle</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {releases.map((r) => (
                    <tr key={r.id}>
                      <td>{r.platform}</td>
                      <td>{r.version}</td>
                      <td>{r.is_active ? "Activo" : "Inactivo"}</td>
                      <td>{r.mandatory ? "Obligatorio" : "Opcional"}</td>
                      <td>
                        <a
                          className="text-sm underline opacity-80"
                          href={assetUrl(r.bundle_path)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.bundle_path.split("/").pop()}
                        </a>
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1">
                          {!r.is_active && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() =>
                                void activate(r.id)
                                  .then(() => {
                                    onReleasesChanged();
                                    appToast.success("Release activado");
                                  })
                                  .catch((e) =>
                                    appToast.error(
                                      e instanceof Error ? e.message : "Error",
                                    ),
                                  )
                              }
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              void setMandatory(r.id, !r.mandatory)
                                .then(() =>
                                  appToast.success(
                                    !r.mandatory
                                      ? "Marcado obligatorio"
                                      : "Marcado opcional",
                                  ),
                                )
                                .catch((e) =>
                                  appToast.error(
                                    e instanceof Error ? e.message : "Error",
                                  ),
                                )
                            }
                          >
                            {r.mandatory ? "Quitar forzada" : "Marcar forzada"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onPress={() => {
                              if (!confirm("¿Eliminar este release?")) return;
                              void remove(r.id)
                                .then(() => appToast.success("Eliminado"))
                                .catch((e) =>
                                  appToast.error(
                                    e instanceof Error ? e.message : "Error",
                                  ),
                                );
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <Modal.Backdrop isOpen={uploadState.isOpen} onOpenChange={uploadState.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Subir release — {app.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <Select
                selectedKey={platform}
                onSelectionChange={(key) => {
                  if (key === "ios" || key === "android") setPlatform(key);
                }}
              >
                <Label>Plataforma</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="android">Android</ListBox.Item>
                    <ListBox.Item id="ios">iOS</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
              <label className={gp.label}>
                Versión
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </label>
              <label className={gp.label}>
                Bundle (.bundle / JS)
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className={gp.label}>
                Notas
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={mandatory}
                  onChange={(e) => setMandatoryFlag(e.target.checked)}
                />
                <span>
                  <span className="font-semibold">Actualización forzada</span>
                  <span className="mt-0.5 block text-xs opacity-70">
                    El usuario debe instalar esta versión para seguir.
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activateOnUpload}
                  onChange={(e) => setActivateOnUpload(e.target.checked)}
                />
                Activar al subir
              </label>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={uploadState.close}>
                Cancelar
              </Button>
              <Button onPress={() => void onUpload()} isDisabled={busy}>
                Subir
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
