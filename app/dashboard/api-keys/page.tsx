"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { useCallback, useEffect, useState } from "react";
import Key from "@gravity-ui/icons/Key";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { apiUrl } from "@/src/utils/apiUrl";

type ApiKeyRecord = {
  id: number;
  name: string;
  prefix: string;
  active: boolean;
  business_id: number;
  business_name: string;
  created_at: string;
  updated_at: string;
};

export default function ApiKeysPage() {
  const { apps: businesses } = useApps();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const createState = useOverlayState();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/api-keys"));
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {
      console.error("Error fetching api keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setCreatedKey(null);
    const form = new FormData(e.currentTarget);
    const business_id = Number(form.get("business_id"));

    if (!business_id) {
      setError("Debe seleccionar una aplicación");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/api-keys"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") as string,
          business_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear API key");
        return;
      }

      setCreatedKey(data.key);
      fetchKeys();
    } catch {
      setError("Error al crear API key");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(key: ApiKeyRecord) {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/api-keys/${key.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al revocar API key");
        return;
      }

      fetchKeys();
    } catch {
      setError("Error al revocar API key");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="gp-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key width={24} height={24} className="text-zinc-700" />
          <h1 className="gp-title">API Keys</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nueva API key
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-105">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Nueva API key</Modal.Heading>
                </Modal.Header>

                {createdKey ? (
                  <Modal.Body className="space-y-4">
                    <Alert status="success">
                      <Alert.Description>
                        API key creada correctamente. Copiala ahora porque no se
                        volverá a mostrar.
                      </Alert.Description>
                    </Alert>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={createdKey}
                        className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5 font-mono text-sm text-zinc-900 outline-none"
                      />
                      <Button
                        onPress={() => {
                          navigator.clipboard.writeText(createdKey);
                          setCreatedKey(null);
                          createState.close();
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </Modal.Body>
                ) : (
                  <form onSubmit={handleCreate}>
                    <Modal.Body className="space-y-4">
                      {error && (
                        <Alert status="danger">
                          <Alert.Description>{error}</Alert.Description>
                        </Alert>
                      )}
                      <label className="gp-label">
                        Aplicación
                        <select
                          name="business_id"
                          required
                          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="">Seleccionar aplicación</option>
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="gp-label">
                        Nombre descriptivo
                        <input
                          name="name"
                          required
                          placeholder="Ej: sistema-contable"
                          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </label>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" slot="close">
                        Cancelar
                      </Button>
                      <Button type="submit" isDisabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : "Crear"}
                      </Button>
                    </Modal.Footer>
                  </form>
                )}
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>

      <p className="-mt-4 gp-subtitle">
        Las API keys se deben colocar en el backend de cada proyecto para
        autenticar las consultas a la API, como verificar suscripciones y
        acceder a los datos de la aplicación.
      </p>

      {error && (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      {keys.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <Key width={48} height={48} className="text-zinc-300" />
          <p className="gp-subtitle">
            No hay API keys registradas todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Aplicación
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Prefijo
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Creada
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-zinc-900">
                    {key.business_name}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-zinc-500">
                      {key.prefix}...
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {key.active ? (
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-700">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-700">
                        Revocada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(key.created_at).toLocaleDateString("es-PY", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {key.active && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(key)}
                        className="cursor-pointer rounded-lg border p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Revocar"
                      >
                        <TrashBin width={14} height={14} />
                      </button>
                    )}
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
