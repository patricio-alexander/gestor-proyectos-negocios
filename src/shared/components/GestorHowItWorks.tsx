"use client";

import { useState, type ReactNode } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import CircleQuestion from "@gravity-ui/icons/CircleQuestion";

type TopicId = "overview" | "plans" | "modules" | "features" | "statuses";

type Topic = {
  id: TopicId;
  label: string;
  body: ReactNode;
};

const TOPICS: Topic[] = [
  {
    id: "overview",
    label: "Cómo encaja todo",
    body: (
      <div className="space-y-3 text-sm text-[var(--gp-text)]">
        <p>
          El gestor define <strong>qué puede venderse y mostrarse</strong> en
          cada app (EdDeli, Store, etc.). Al guardar o cambiar un estado, se
          sincroniza (push) al backend de la app.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-[var(--gp-text-muted)]">
          <li>
            <strong className="text-[var(--gp-text)]">Catálogo</strong>:
            módulos y secciones globales (rutas de producto).
          </li>
          <li>
            <strong className="text-[var(--gp-text)]">App</strong>: se le
            asignan módulos y, si aplica, funciones (p. ej. multi-stock).
          </li>
          <li>
            <strong className="text-[var(--gp-text)]">Plan</strong>: empaqueta
            módulos (y precios) para una app; la suscripción activa ese plan
            en el cliente.
          </li>
          <li>
            <strong className="text-[var(--gp-text)]">Estado</strong>: decide
            si algo está usable, bloqueado, oculto o solo para desarrollo.
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "plans",
    label: "Planes",
    body: (
      <div className="space-y-3 text-sm text-[var(--gp-text)]">
        <p>
          Un <strong>plan</strong> es el producto comercial: nombre, precio
          mensual/anual, la app a la que aplica y qué módulos incluye.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[var(--gp-text-muted)]">
          <li>
            Solo podés elegir módulos que la app ya tenga asignados en
            Aplicaciones.
          </li>
          <li>
            «Crear suscripción» activa el plan en esa app y empuja el
            entitlement (módulos/secciones permitidos).
          </li>
          <li>
            Si la app ya tiene otro plan activo, el gestor pide confirmar el
            reemplazo.
          </li>
          <li>
            Los planes de apps móviles se gestionan en{" "}
            <strong className="text-[var(--gp-text)]">Apps móvil</strong>, no
            aquí.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "modules",
    label: "Módulos y secciones",
    body: (
      <div className="space-y-3 text-sm text-[var(--gp-text)]">
        <p>
          Un <strong>módulo</strong> agrupa áreas del producto (Inventario,
          Ventas…). Dentro hay <strong>secciones</strong>: rutas concretas
          (p. ej. <code className="text-xs">/inventario/lotes</code>).
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[var(--gp-text-muted)]">
          <li>
            Estado <strong className="text-[var(--gp-text)]">global</strong>:
            vale para todas las apps salvo override.
          </li>
          <li>
            Override <strong className="text-[var(--gp-text)]">por app</strong>:
            en el panel del módulo podés dejar una sección en uso solo en
            EdDeli y próximamente en Store, etc.
          </li>
          <li>
            Las <strong className="text-[var(--gp-text)]">capacidades</strong>{" "}
            de una sección son permisos finos (acciones) dentro de esa ruta.
          </li>
          <li>
            Cambiar el estado guarda al instante y sincroniza; el modal no se
            cierra.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "features",
    label: "Funciones",
    body: (
      <div className="space-y-3 text-sm text-[var(--gp-text)]">
        <p>
          Las <strong>funciones</strong> (Features) no son menús: son
          interruptores de producto independientes de las secciones. Ejemplo:{" "}
          <code className="text-xs">multi_stock</code> habilita varios locales
          de inventario.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[var(--gp-text-muted)]">
          <li>
            En <strong className="text-[var(--gp-text)]">Aplicaciones →
            Funciones</strong> definís si la app puede usarlas (en uso /
            próximamente / oculto…).
          </li>
          <li>
            «En uso» en el gestor{" "}
            <strong className="text-[var(--gp-text)]">desbloquea</strong> la
            opción en el cliente; el usuario aún puede activarla en
            Configuración / Store de esa app.
          </li>
          <li>
            No confundir con secciones: lotes es una{" "}
            <strong className="text-[var(--gp-text)]">sección</strong> del
            módulo Inventario; multi-stock es una{" "}
            <strong className="text-[var(--gp-text)]">función</strong>.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "statuses",
    label: "Estados",
    body: (
      <div className="space-y-3 text-sm text-[var(--gp-text)]">
        <ul className="space-y-2.5 text-[var(--gp-text-muted)]">
          <li>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              En uso
            </span>
            : visible y usable en la app (si el plan lo incluye).
          </li>
          <li>
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Próximamente
            </span>
            : se puede mostrar como bloqueado / teaser; no se usa.
          </li>
          <li>
            <span className="font-semibold text-sky-800 dark:text-sky-200">
              Mantenimiento
            </span>
            : temporalmente fuera de servicio.
          </li>
          <li>
            <span className="font-semibold text-violet-800 dark:text-violet-200">
              Solo desarrollador
            </span>
            : solo entornos o usuarios de desarrollo.
          </li>
          <li>
            <span className="font-semibold text-[var(--gp-text)]">Oculto</span>:
            no aparece en la UI del cliente.
          </li>
        </ul>
        <p className="text-[var(--gp-text-muted)]">
          La herencia «↳ catálogo» en overrides por app usa el estado global
          del módulo/sección/función.
        </p>
      </div>
    ),
  },
];

type GestorHowItWorksProps = {
  /** Tema inicial al abrir el modal */
  defaultTopic?: TopicId;
  /** Variante compacta del botón */
  size?: "sm" | "md";
  className?: string;
};

export function GestorHowItWorks({
  defaultTopic = "overview",
  size = "sm",
  className,
}: GestorHowItWorksProps) {
  const modal = useOverlayState();
  const [topic, setTopic] = useState<TopicId>(defaultTopic);
  const current = TOPICS.find((t) => t.id === topic) ?? TOPICS[0];

  return (
    <>
      <Button
        size={size}
        variant="secondary"
        className={className}
        onPress={() => {
          setTopic(defaultTopic);
          modal.open();
        }}
      >
        <CircleQuestion width={16} height={16} />
        Tutorial
      </Button>
      <Modal state={modal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="inline-flex items-center gap-2">
                  <CircleQuestion width={18} height={18} />
                  Cómo funciona el gestor
                </Modal.Heading>
                <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                  Planes, secciones, funciones y estados — guía rápida.
                </p>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {TOPICS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        topic === t.id
                          ? "bg-[var(--gp-primary)] text-[var(--gp-primary-text)]"
                          : "bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-[55vh] overflow-y-auto pr-1">
                  {current.body}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
