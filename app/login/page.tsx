"use client";

import { useEffect, useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Label, Spinner, TextField } from "@heroui/react";
import Tachometer from "@gravity-ui/icons/Tachometer";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Key from "@gravity-ui/icons/Key";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import { assetUrl } from "@/src/utils/assetUrl";

const EYE_LOGO = assetUrl("/eye-logo-raptor-solutions.svg");
const WORDMARK = assetUrl("/raptor-solutions.svg");

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(apiUrl("/api/auth/login"), {
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
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="flex min-h-dvh">
      {/* Panel izquierdo — branding */}
      <div className="gp-login-brand relative hidden w-[48%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
            style={{ background: "rgba(255,107,0,0.28)" }}
          />
          <div
            className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl"
            style={{ background: "rgba(251,146,60,0.16)" }}
          />
        </div>

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <img
              src={EYE_LOGO}
              alt=""
              aria-hidden
              className="h-9 w-auto object-contain"
            />
            <img
              src={WORDMARK}
              alt="Raptor Solutions"
              className="h-7 w-auto object-contain object-left"
            />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--gp-text-faint)" }}>
            Control de licencias EdDeli
          </p>
        </div>

        <div className="relative z-10 space-y-8 px-10 pb-12">
          <div>
            <h1
              className="max-w-md text-3xl font-semibold leading-tight tracking-tight"
              style={{ color: "var(--gp-text)" }}
            >
              Licencias, aplicaciones y acceso en un solo lugar
            </h1>
            <p
              className="mt-4 max-w-sm text-base leading-relaxed"
              style={{ color: "var(--gp-text-faint)" }}
            >
              Panel administrativo para gestionar planes, suscripciones y
              permisos de cada tenant EdDeli.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              {
                Icon: ShieldKeyhole,
                text: "Emisión y revocación de licencias",
              },
              { Icon: Key, text: "API keys por aplicación" },
              {
                Icon: Tachometer,
                text: "Usuarios, roles y cuentas del gestor",
              },
            ].map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm"
                style={{ color: "var(--gp-text-muted)" }}
              >
                <span
                  className="gp-icon-box-sm"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--gp-primary) 35%, transparent)",
                    boxShadow: "0 0 12px var(--gp-glow)",
                  }}
                >
                  <Icon width={16} height={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p
          className="relative z-10 flex items-center gap-2 px-10 pb-8 text-xs"
          style={{ color: "var(--gp-text-faint)" }}
        >
          <img src={EYE_LOGO} alt="" aria-hidden className="h-4 w-auto opacity-80" />
          © {new Date().getFullYear()} Raptor Solutions
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="gp-login-panel flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <img
            src={EYE_LOGO}
            alt=""
            aria-hidden
            className="h-9 w-auto object-contain"
          />
          <img
            src={WORDMARK}
            alt="Raptor Solutions"
            className="h-6 w-auto object-contain"
          />
        </div>

        <div className="w-full max-w-100">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="gp-title-lg">Bienvenido de nuevo</h2>
            <p className="gp-subtitle mt-2">
              Ingresá con tu cuenta de administrador
            </p>
          </div>

          <div className="gp-login-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert status="danger" className="rounded-xl">
                  <Alert.Description>{error}</Alert.Description>
                </Alert>
              )}

              <TextField fullWidth>
                <Label style={{ color: "var(--gp-text)" }}>Usuario</Label>
                <Input
                  placeholder="administrador"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1.5 gp-input"
                />
              </TextField>

              <TextField fullWidth>
                <Label style={{ color: "var(--gp-text)" }}>Contraseña</Label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5 gp-input"
                />
              </TextField>

              <Button
                fullWidth
                type="submit"
                isDisabled={loading}
                className="mt-2 h-11 font-medium"
                style={{
                  backgroundColor: "var(--gp-primary)",
                  color: "var(--gp-primary-text)",
                }}
              >
                {loading ? <Spinner size="sm" /> : "Ingresar al panel"}
              </Button>
            </form>
          </div>

          <p className={`mt-6 text-center text-xs lg:text-left ${gp.subtitle}`}>
            Acceso restringido al equipo de administración.
          </p>
        </div>
      </div>
    </div>
  );
}
