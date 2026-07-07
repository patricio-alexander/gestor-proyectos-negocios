"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Key from "@gravity-ui/icons/Key";
import Plus from "@gravity-ui/icons/Plus";
import { useMemo, useState } from "react";
import { useApiKeys } from "../hooks/useApiKeys";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { ApiKey } from "../types";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { ApiKeyCard } from "./ApiKeyCard";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Ban from "@gravity-ui/icons/Ban";

const PAGE_SIZE = 9;

function matchesKeySearch(key: ApiKey, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [key.name, key.business_name, key.prefix]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function ApiKeysManager() {
  const { apps } = useApps();
  const { keys, loading, active, revoked, create, revoke } = useApiKeys();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const createState = useOverlayState();

  const filterKeys = useMemo(
    () => (key: ApiKey, query: string) => matchesKeySearch(key, query),
    [],
  );

  const {
    search,
    setSearch,
    paginated,
    total,
  } = usePaginatedSearch(keys, filterKeys, PAGE_SIZE);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setCreatedKey(null);
    const form = new FormData(e.currentTarget);
    const appId = Number(form.get("app_id"));
    if (!appId) {
      setError("Debe seleccionar una aplicación");
      setSubmitting(false);
      return;
    }
    try {
      const key = await create({
        name: form.get("name") as string,
        app_id: appId,
      });
      setCreatedKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear API key");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(key: ApiKey) {
    setError("");
    setRevokingId(key.id);
    try {
      await revoke(key.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al revocar");
    } finally {
      setRevokingId(null);
    }
  }

  function handleCopy() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeCreateModal() {
    createState.close();
    setCreatedKey(null);
    setCopied(false);
    setError("");
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
        title="API Keys"
        description="Autenticación remota para que las apps cliente consulten planes, suscripciones y límites."
        Icon={Key}
        action={
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              Nueva API key
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>
                      {createdKey ? "API key generada" : "Nueva API key"}
                    </Modal.Heading>
                  </Modal.Header>
                  {createdKey ? (
                    <>
                      <Modal.Body className="space-y-4">
                        <Alert status="success">
                          <Alert.Description>
                            Copiala ahora. No se volverá a mostrar completa.
                          </Alert.Description>
                        </Alert>
                        <div
                          className="flex gap-2 rounded-lg border p-2"
                          style={{ borderColor: "var(--gp-card-border)" }}
                        >
                          <input
                            readOnly
                            value={createdKey}
                            className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-[var(--gp-text)] outline-none"
                          />
                          <Button size="sm" onPress={handleCopy}>
                            {copied ? "Copiado" : "Copiar"}
                          </Button>
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button onPress={closeCreateModal}>Cerrar</Button>
                      </Modal.Footer>
                    </>
                  ) : (
                    <form onSubmit={handleCreate}>
                      <Modal.Body className="space-y-4">
                        {error && (
                          <Alert status="danger">
                            <Alert.Description>{error}</Alert.Description>
                          </Alert>
                        )}
                        <label className={gp.label}>
                          Aplicación
                          <select name="app_id" required className={gp.select}>
                            <option value="">Seleccionar aplicación</option>
                            {apps.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={gp.label}>
                          Nombre descriptivo
                          <input
                            name="name"
                            required
                            placeholder="Ej: backend-eddeli-prod"
                            className={gp.input}
                          />
                        </label>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" slot="close">
                          Cancelar
                        </Button>
                        <Button type="submit" isDisabled={submitting}>
                          {submitting ? <Spinner size="sm" /> : "Generar key"}
                        </Button>
                      </Modal.Footer>
                    </form>
                  )}
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Key} label="Total" value={keys.length} />
        <StatCard
          icon={CircleCheck}
          label="Activas"
          value={active}
          featured={active > 0}
        />
        <StatCard icon={Ban} label="Revocadas" value={revoked} />
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre, app o prefijo…"
        total={total}
        totalLabel="keys"
      />

      {paginated.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <Key width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <p className="text-sm font-medium text-[var(--gp-text)]">
            {search.trim() ? "Sin resultados" : "No hay API keys"}
          </p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Generá una key para conectar el backend de cada aplicación cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((key) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              onRevoke={handleRevoke}
              revoking={revokingId === key.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
