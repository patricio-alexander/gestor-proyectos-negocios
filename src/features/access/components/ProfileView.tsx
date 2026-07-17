"use client";

import { Button, Card, Spinner } from "@heroui/react";
import Person from "@gravity-ui/icons/Person";
import { useState } from "react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { apiUrl } from "@/src/utils/apiUrl";

export function ProfileView() {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    try {
      const res = await fetch(apiUrl("/api/access/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.get("display_name") as string,
          email: form.get("email") as string,
          ...(password
            ? {
                password,
                current_password: form.get("current_password") as string,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      appToast.success("Perfil actualizado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <PageHeader title="Mi perfil" Icon={Person} />

      <Card className={`${gp.card} max-w-lg p-6`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className={gp.subtitle}>
            Usuario:{" "}
            <span className="font-medium" style={{ color: "var(--gp-text)" }}>
              @{user.username}
            </span>
          </p>

          {user.roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <span key={r.id} className={gp.badge}>
                  {r.name}
                </span>
              ))}
            </div>
          )}

          <label className={gp.label}>
            Nombre visible
            <input
              name="display_name"
              defaultValue={user.display_name ?? ""}
              className={gp.input}
            />
          </label>
          <label className={gp.label}>
            Email
            <input
              name="email"
              type="email"
              defaultValue={user.email ?? ""}
              className={gp.input}
            />
          </label>

          <hr style={{ borderColor: "var(--gp-border)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--gp-text)" }}>
            Cambiar contraseña
          </p>
          <label className={gp.label}>
            Contraseña actual
            <input name="current_password" type="password" className={gp.input} />
          </label>
          <label className={gp.label}>
            Nueva contraseña
            <input name="password" type="password" className={gp.input} />
          </label>

          <Button type="submit" isDisabled={submitting}>
            {submitting ? <Spinner size="sm" /> : "Guardar cambios"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
