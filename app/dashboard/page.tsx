"use client";

import {
  Alert,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from "@heroui/react";
import { useState } from "react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Briefcase from "@gravity-ui/icons/Briefcase";

export default function DashboardPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [businessHash, setBusinessHash] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateSub() {
    if (!licenseKey.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: licenseKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear suscripción");
      } else {
        setResult(data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckSub() {
    if (!businessHash.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscriptions/check?business_hash=${encodeURIComponent(businessHash.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al verificar suscripción");
      } else {
        setResult(data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Bienvenido al panel</CardTitle>
          <CardDescription>
            Seleccioná una sección del menú lateral para comenzar
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard width={18} height={18} />
            <CardTitle>Crear suscripción</CardTitle>
          </div>
          <CardDescription>
            Ingresá una clave de licencia para crear una suscripción
          </CardDescription>
        </CardHeader>
        <Card.Content className="space-y-3">
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Clave de licencia"
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          <Button
            isDisabled={loading || !licenseKey.trim()}
            onPress={handleCreateSub}
          >
            {loading ? <Spinner size="sm" /> : "Crear suscripción"}
          </Button>
          {result && (
            <div className="rounded-lg border bg-zinc-50 p-3">
              <p className="mb-2 text-xs font-medium text-zinc-500">
                Resultado
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-zinc-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          {error && (
            <Alert status="danger">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
        </Card.Content>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase width={18} height={18} />
            <CardTitle>Verificar suscripción</CardTitle>
          </div>
          <CardDescription>
            Ingresá el hash de un negocio para ver si tiene suscripción activa
          </CardDescription>
        </CardHeader>
        <Card.Content className="space-y-3">
          <input
            value={businessHash}
            onChange={(e) => setBusinessHash(e.target.value)}
            placeholder="Hash del negocio"
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          <Button
            isDisabled={loading || !businessHash.trim()}
            onPress={handleCheckSub}
          >
            {loading ? <Spinner size="sm" /> : "Verificar"}
          </Button>
          {result && (
            <div className="rounded-lg border bg-zinc-50 p-3">
              <p className="mb-2 text-xs font-medium text-zinc-500">
                Resultado
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-zinc-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          {error && (
            <Alert status="danger">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
