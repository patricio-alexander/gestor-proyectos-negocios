"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Credenciales inválidas");
      return;
    }

    router.push("/dashboard");
  }

  useEffect(() => {
    if (error) {
      const timeOut = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timeOut);
    }
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 px-4">
      <Card className="w-full max-w-sm">
        <Card.Header className="text-center">
          <Card.Title>Iniciar sesión</Card.Title>
          <Card.Description>
            Ingresá tus credenciales para continuar
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert status="danger">
                <Alert.Description>{error}</Alert.Description>
              </Alert>
            )}

            <TextField fullWidth>
              <Label>Usuario</Label>
              <Input
                placeholder="admin"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </TextField>

            <TextField fullWidth>
              <Label>Contraseña</Label>
              <Input
                placeholder="••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </TextField>

            <Button fullWidth isDisabled={loading} type="submit">
              {loading ? <Spinner size="sm" /> : "Ingresar"}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
