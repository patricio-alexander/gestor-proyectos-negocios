"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Plus from "@gravity-ui/icons/Plus";
import BookOpen from "@gravity-ui/icons/BookOpen";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import PaperPlane from "@gravity-ui/icons/PaperPlane";
import ArrowDownToLine from "@gravity-ui/icons/ArrowDownToLine";
import ArrowUpFromLine from "@gravity-ui/icons/ArrowUpFromLine";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { NewspaperPreview } from "./NewspaperPreview";

const KINDS = [
  { id: "portada", label: "Portada" },
  { id: "interior", label: "Interior" },
  { id: "breve", label: "Breve" },
  { id: "editorial", label: "Editorial" },
  { id: "proximamente", label: "Próximamente" },
] as const;

type NewsKind = (typeof KINDS)[number]["id"];

type NewsTarget = {
  app_id: number;
  push_ok: boolean | null;
  pushed_at: string | null;
  app?: { id: number; name: string | null; kind?: string };
};

type NewsItem = {
  id: number;
  title: string;
  subtitle: string | null;
  body: string | null;
  kind: NewsKind;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  targets: NewsTarget[];
};

function kindLabel(kind: string) {
  return KINDS.find((k) => k.id === kind)?.label || kind;
}

function summarizePush(
  push:
    | Array<{ app_name: string; ok: boolean; skipped?: boolean; error?: string }>
    | undefined,
) {
  if (!push?.length) return "Sin apps destino";
  const ok = push.filter((p) => p.ok).length;
  const fail = push.filter((p) => !p.ok);
  if (!fail.length) return `Enviado a ${ok} app(s)`;
  return `OK ${ok} · falló: ${fail.map((f) => f.app_name).join(", ")}`;
}

export function NewsManager() {
  const queryClient = useQueryClient();
  const { apps } = useApps();
  const manageModal = useOverlayState();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<NewsKind>("breve");
  const [sortOrder, setSortOrder] = useState("10");
  const [appIds, setAppIds] = useState<number[]>([]);

  const viteApps = useMemo(
    () =>
      apps.filter((a) => {
        if (a.kind !== "deployment") return false;
        const name = String(a.name || "").trim().toLowerCase();
        if (name === "scheduly") return false;
        return (
          name === "eddeli" ||
          name === "store" ||
          name === "tienda" ||
          /\/(eddeli|store|tienda)api\/subscription\/entitlement/i.test(
            String(a.entitlement_url || ""),
          )
        );
      }),
    [apps],
  );

  const newsQuery = useQuery({
    queryKey: queryKeys.news.list,
    queryFn: () => fetchJson<NewsItem[]>("/api/news"),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.news.all });

  const resetForm = (defaults?: Partial<NewsItem>) => {
    setEditing(defaults?.id ? (defaults as NewsItem) : null);
    setTitle(defaults?.title || "");
    setSubtitle(defaults?.subtitle || "");
    setBody(defaults?.body || "");
    setKind((defaults?.kind as NewsKind) || "breve");
    setSortOrder(String(defaults?.sort_order ?? 10));
    setAppIds(
      defaults?.targets?.map((t) => t.app_id) ?? viteApps.map((a) => a.id),
    );
  };

  const openManage = () => {
    resetForm();
    manageModal.open();
  };

  const openEdit = (item: NewsItem) => {
    resetForm(item);
  };

  const toggleApp = (id: number) => {
    setAppIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtitle,
        body,
        kind,
        sort_order: Number(sortOrder) || 0,
        app_ids: appIds,
      };
      if (editing) {
        return fetchJson(`/api/news/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      return fetchJson("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      appToast.success(editing ? "Noticia actualizada" : "Noticia creada");
      resetForm();
      invalidate();
    },
    onError: (e: Error) => appToast.error(e.message || "No se pudo guardar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchJson(`/api/news/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      appToast.success("Noticia eliminada");
      if (editing) resetForm();
      invalidate();
    },
    onError: (e: Error) => appToast.error(e.message || "No se pudo eliminar"),
  });

  const pushAllMutation = useMutation({
    mutationFn: () =>
      fetchJson<{
        count: number;
        push: Parameters<typeof summarizePush>[0];
      }>("/api/news/push", { method: "POST" }),
    onSuccess: (data) => {
      appToast.success(
        `${data.count} noticia(s) · ${summarizePush(data.push)}`,
      );
      invalidate();
    },
    onError: (e: Error) => appToast.error(e.message || "No se pudo enviar"),
  });

  const importMutation = useMutation({
    mutationFn: (payload: {
      items: Array<Record<string, unknown>>;
      default_app_ids: number[];
    }) =>
      fetchJson<{ count: number }>("/api/news/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      appToast.success(`Importadas ${data.count} noticia(s)`);
      invalidate();
    },
    onError: (e: Error) => appToast.error(e.message || "No se pudo importar"),
  });

  const items = newsQuery.data ?? [];
  const previewItems = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        title: i.title,
        subtitle: i.subtitle,
        body: i.body,
        kind: i.kind,
        publishedAt: i.published_at,
        sortOrder: i.sort_order,
      })),
    [items],
  );

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      items: items.map((i) => ({
        title: i.title,
        subtitle: i.subtitle,
        body: i.body,
        kind: i.kind,
        sort_order: i.sort_order,
        is_published: i.is_published,
        published_at: i.published_at,
        app_ids: i.targets.map((t) => t.app_id),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noticias-periodico-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    appToast.success("JSON exportado");
  };

  const onImportFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { items?: unknown })?.items)
          ? (parsed as { items: unknown[] }).items
          : null;
      if (!list?.length) {
        appToast.error("El JSON no tiene piezas válidas");
        return;
      }
      if (
        !window.confirm(
          `¿Reemplazar las noticias actuales por las ${list.length} del JSON?`,
        )
      ) {
        return;
      }
      importMutation.mutate({
        items: list as Array<Record<string, unknown>>,
        default_app_ids: viteApps.map((a) => a.id),
      });
    } catch {
      appToast.error("No se pudo leer el JSON");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-nowrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen width={22} height={22} className="gp-icon-box-text shrink-0" />
          <div className="min-w-0">
            <h1 className={gp.title}>Noticias</h1>
            <p className="truncate text-xs opacity-70">
              Vista del periódico · gestionar, JSON y envío a apps
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
          <Button size="sm" variant="secondary" onPress={openManage}>
            <Pencil className="size-3.5" />
            Gestionar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={exportJson}
            isDisabled={!items.length}
          >
            <ArrowDownToLine className="size-3.5" />
            Exportar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isPending={importMutation.isPending}
            onPress={() => importInputRef.current?.click()}
          >
            <ArrowUpFromLine className="size-3.5" />
            Importar
          </Button>
          <Button
            size="sm"
            isPending={pushAllMutation.isPending}
            onPress={() => {
              if (
                window.confirm(
                  "¿Publicar todas las noticias y enviarlas a las apps destino?",
                )
              ) {
                pushAllMutation.mutate();
              }
            }}
            isDisabled={!items.length}
          >
            <PaperPlane className="size-3.5" />
            Enviar
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {newsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div
          className="rounded-xl p-3 md:p-4"
          style={{
            background:
              "linear-gradient(180deg, #d9d6cf 0%, #cfcbc2 50%, #d9d6cf 100%)",
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="size-5" style={{ color: "#1c1b19" }} />
            <div>
              <h2
                className="text-base font-extrabold leading-tight"
                style={{ color: "#1c1b19", fontFamily: "Georgia, serif" }}
              >
                El Diario del Sistema
              </h2>
              <p className="text-xs" style={{ color: "#5c5852" }}>
                Vista previa · {items.length} pieza(s)
              </p>
            </div>
          </div>
          <NewspaperPreview items={previewItems} />
        </div>
      )}

      <Modal state={manageModal}>
        <Modal.Backdrop>
          <Modal.Container size="lg" className="w-full max-w-5xl">
            <Modal.Dialog className="max-h-[90vh] overflow-hidden">
              <Modal.Header>
                <Modal.Heading>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="size-5" />
                    Gestionar noticias
                  </span>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid max-h-[70vh] gap-4 overflow-auto md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Piezas ({items.length})</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => resetForm()}
                    >
                      <Plus className="size-3.5" />
                      Nueva
                    </Button>
                  </div>
                  <div className="max-h-[58vh] space-y-2 overflow-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-2.5 ${
                          editing?.id === item.id ? "ring-2 ring-current/30" : ""
                        }`}
                      >
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          <span className={gp.badge}>{kindLabel(item.kind)}</span>
                          <span className={gp.badge}>
                            {item.is_published ? "Publicada" : "Borrador"}
                          </span>
                          <span className={gp.badge}>orden {item.sort_order}</span>
                        </div>
                        <p className="text-sm font-semibold leading-snug">
                          {item.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => openEdit(item)}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            isPending={deleteMutation.isPending}
                            onPress={() => {
                              if (window.confirm("¿Eliminar esta noticia?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                          >
                            <TrashBin className="size-3.5" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!items.length ? (
                      <p className="text-sm opacity-70">
                        No hay piezas. Completá el formulario y guardá.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {editing ? `Editar #${editing.id}` : "Nueva noticia"}
                  </p>
                  <label className={gp.label}>
                    Tipo
                    <select
                      className={gp.select}
                      value={kind}
                      onChange={(e) => setKind(e.target.value as NewsKind)}
                    >
                      {KINDS.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={gp.label}>
                    Título
                    <input
                      className={gp.input}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </label>
                  <label className={gp.label}>
                    Bajada
                    <input
                      className={gp.input}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Resumen corto"
                    />
                  </label>
                  <label className={gp.label}>
                    Cuerpo
                    <textarea
                      className={gp.textarea}
                      rows={5}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </label>
                  <label className={gp.label}>
                    Orden
                    <input
                      className={gp.input}
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    />
                    <span className="mt-1 block text-xs opacity-70">
                      Portada: 0 · Sistema (pág.1): 10–13 · Hechos (pág.2): 20–23 ·
                      Próximamente: 90+
                    </span>
                  </label>
                  <div>
                    <p className="mb-2 text-sm font-medium">Apps destino</p>
                    <div className="flex flex-wrap gap-3">
                      {viteApps.map((app) => (
                        <label
                          key={app.id}
                          className="inline-flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={appIds.includes(app.id)}
                            onChange={() => toggleApp(app.id)}
                          />
                          {app.name}
                        </label>
                      ))}
                      {!viteApps.length ? (
                        <p className="text-sm opacity-70">
                          No hay apps Vite registradas.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="secondary"
                      onPress={() => resetForm()}
                      isDisabled={!editing && !title && !body}
                    >
                      Limpiar
                    </Button>
                    <Button
                      isPending={saveMutation.isPending}
                      onPress={() => saveMutation.mutate()}
                      isDisabled={!title.trim() || !appIds.length}
                    >
                      {editing ? "Guardar cambios" : "Crear noticia"}
                    </Button>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => manageModal.close()}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
