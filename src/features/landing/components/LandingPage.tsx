"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import ArrowRight from "@gravity-ui/icons/ArrowRight";
import Briefcase from "@gravity-ui/icons/Briefcase";
import ChartLine from "@gravity-ui/icons/ChartLine";
import CircleDollar from "@gravity-ui/icons/CircleDollar";
import Code from "@gravity-ui/icons/Code";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Eye from "@gravity-ui/icons/Eye";
import Layers from "@gravity-ui/icons/Layers";
import Sliders from "@gravity-ui/icons/Sliders";
import Shield from "@gravity-ui/icons/Shield";
import TargetDart from "@gravity-ui/icons/TargetDart";
import { useLandingTheme } from "../hooks/useLandingTheme";
import { RaptorSolutionsLogo } from "./RaptorSolutionsLogo";

const PILLARS = [
  {
    icon: ChartLine,
    label: "Rendimiento",
    hint: "Operaciones más eficientes y equipos que avanzan con claridad",
  },
  {
    icon: CircleDollar,
    label: "Rentabilidad",
    hint: "Inversión tecnológica alineada a resultados reales del negocio",
  },
  {
    icon: Shield,
    label: "Control",
    hint: "Visibilidad y gobierno sobre las aplicaciones que sostienen tu empresa",
  },
] as const;

const VALUES = [
  { value: "360°", label: "Enfoque integral" },
  { value: "1", label: "Socio tecnológico" },
  { value: "24/7", label: "Compromiso continuo" },
  { value: "100%", label: "Orientados a resultados" },
] as const;

const OFFERINGS = [
  {
    icon: Cubes3Overlap,
    title: "Apps que prestamos",
    text: "Ponemos a disposición aplicaciones listas para operar. No partís de cero: activamos lo que tu negocio necesita y la app se ajusta a tu forma de trabajar.",
  },
  {
    icon: Sliders,
    title: "Configuración a tu medida",
    text: "Adaptamos módulos, accesos y reglas de negocio para que el software encaje con tu operación real, sin partir de cero.",
  },
  {
    icon: Code,
    title: "Desarrollo a medida",
    text: "Cuando tu caso lo requiere, diseñamos y construimos soluciones propias: integraciones, flujos o apps pensadas exclusivamente para tu negocio.",
  },
  {
    icon: Eye,
    title: "Gobierno de aplicaciones",
    text: "Supervisamos y coordinamos el ecosistema de apps de tu negocio para que todo funcione alineado a tus objetivos.",
  },
  {
    icon: Layers,
    title: "Integración de sistemas",
    text: "Conectamos plataformas dispersas en un entorno coherente, reduciendo fricción entre áreas y herramientas.",
  },
  {
    icon: TargetDart,
    title: "Consultoría estratégica",
    text: "Te acompañamos a priorizar, decidir y ejecutar con criterio técnico y visión de negocio.",
  },
  {
    icon: Briefcase,
    title: "Operación y soporte",
    text: "Nos hacemos cargo del día a día tecnológico para que tu equipo se enfoque en lo que importa.",
  },
] as const;

const APPROACH = [
  {
    step: "01",
    title: "Escuchamos y diagnosticamos",
    text: "Conocemos tu operación, tus apps y tus cuellos de botella antes de proponer cualquier cambio.",
  },
  {
    step: "02",
    title: "Diseñamos la solución",
    text: "Definimos si conviene activar una app existente, configurarla o desarrollar algo a medida — siempre con un plan claro y medible.",
  },
  {
    step: "03",
    title: "Implementamos y acompañamos",
    text: "Ejecutamos con rigor y nos quedamos cerca para asegurar que la solución funcione en la práctica.",
  },
] as const;

const MISSION_POINTS = [
  "Apps listas que se adaptan a cada negocio",
  "Desarrollo a medida cuando el caso lo pide",
  "Control centralizado de tu operación digital",
  "Acompañamiento continuo, no un proyecto y chau",
] as const;

export function LandingPage() {
  useLandingTheme();

  return (
    <div className="landing-page relative min-h-dvh overflow-x-hidden bg-black text-white">
      <div className="landing-page__glow landing-page__glow--top" aria-hidden />
      <div className="landing-page__glow landing-page__glow--bottom" aria-hidden />
      <div className="landing-page__glow landing-page__glow--left" aria-hidden />
      <div className="landing-page__grid" aria-hidden />
      <div className="landing-page__noise" aria-hidden />

      <header className="landing-page__header relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <RaptorSolutionsLogo className="h-7 w-auto text-white sm:h-8" />
        <Link href="/login" className="inline-flex">
          <Button
            size="sm"
            variant="secondary"
            className="landing-page__header-cta border-white/10 bg-white/5 text-white"
          >
            Entrar
            <ArrowRight width={14} height={14} />
          </Button>
        </Link>
      </header>

      <section className="landing-page__hero relative z-10 mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-6 text-center sm:px-10">
        <div className="landing-page__logo-wrap mb-8 sm:mb-10">
          <div className="landing-page__logo-glow" aria-hidden />
          <RaptorSolutionsLogo className="landing-page__logo relative z-10 h-auto w-[min(88vw,560px)] text-white" />
        </div>

        <p className="landing-page__eyebrow mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF6B00]">
          Tecnología para negocios que escalan
        </p>

        <h1 className="landing-page__headline max-w-3xl text-balance text-[clamp(1.75rem,4.5vw,3rem)] font-semibold leading-[1.12] tracking-tight text-white">
          Creamos soluciones que recuperan{" "}
          <span className="landing-page__accent">rendimiento</span>,{" "}
          <span className="landing-page__accent">rentabilidad</span> y{" "}
          <span className="landing-page__accent">control</span> de tu negocio.
        </h1>

        <p className="landing-page__tagline mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/62 sm:text-lg">
          Somos Raptor Solutions: prestamos aplicaciones y tecnología que se
          ajustan a cada cliente, con el control y la visibilidad que tu negocio
          necesita para crecer.
        </p>

        <ul className="landing-page__pillars mt-10 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, label, hint }) => (
            <li key={label} className="landing-page__pillar rounded-2xl px-4 py-4 text-left">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="landing-page__pillar-icon flex size-9 items-center justify-center rounded-xl">
                  <Icon width={18} height={18} />
                </span>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
              <p className="text-xs leading-relaxed text-white/50">{hint}</p>
            </li>
          ))}
        </ul>

        <div className="landing-page__cta-wrap mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login" className="inline-flex">
            <Button size="lg" className="landing-page__cta min-w-[200px] font-semibold">
              Entrar
              <ArrowRight width={18} height={18} />
            </Button>
          </Link>
          <p className="text-sm text-white/40">
            Acceso para clientes y equipos Raptor
          </p>
        </div>
      </section>

      <section className="landing-page__stats relative z-10 border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/8 sm:grid-cols-4">
          {VALUES.map(({ value, label }) => (
            <div key={label} className="landing-page__stat bg-black px-6 py-8 text-center">
              <p className="text-2xl font-semibold tracking-tight text-[#FF6B00] sm:text-3xl">
                {value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/50 sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-page__section relative z-10 mx-auto w-full max-w-6xl px-6 py-20 sm:px-10">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FF6B00]">
            Quiénes somos
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Un partner tecnológico obsesionado con devolverle el control a tu
            negocio
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
            Raptor Solutions nace para resolver un problema concreto: muchas
            empresas dependen de múltiples aplicaciones y procesos que nadie
            termina de dominar. Nosotros entramos con software probado, lo
            configuramos según tu operación y te acompañamos para que todo
            funcione en la práctica.
          </p>
        </div>

        <div className="landing-page__about rounded-3xl p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-white/60 sm:text-base">
            Prestamos apps que ya funcionan y las adaptamos a tus necesidades, y
            cuando hace falta algo que no existe, también desarrollamos
            soluciones a medida. En ambos casos trabajamos cerca de tu equipo,
            con soporte y visión de largo plazo.
          </p>
        </div>
      </section>

      <section className="landing-page__section landing-page__section--muted relative z-10 border-y border-white/8">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FF6B00]">
              Qué ofrecemos
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Apps que prestamos, configuramos o desarrollamos para vos
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
              Apps listas para operar, configuración flexible y desarrollo a
              medida cuando tu negocio necesita algo que aún no existe. Vos
              elegís el camino; nosotros lo ejecutamos.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERINGS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="landing-page__feature rounded-2xl p-5">
                <span className="landing-page__feature-icon mb-4 flex size-10 items-center justify-center rounded-xl">
                  <Icon width={20} height={20} />
                </span>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-page__section relative z-10 mx-auto w-full max-w-6xl px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FF6B00]">
              Cómo trabajamos
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Un proceso claro, de la conversación inicial al resultado
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
              Creemos en relaciones transparentes: primero entendemos, después
              proponemos y recién entonces construimos. Sin atajos que generen
              deuda técnica o dependencia innecesaria.
            </p>

            <ol className="mt-10 space-y-6">
              {APPROACH.map(({ step, title, text }) => (
                <li key={step} className="flex gap-4">
                  <span className="landing-page__step-num shrink-0 font-mono text-sm font-semibold">
                    {step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="landing-page__preview relative">
            <div className="landing-page__preview-glow" aria-hidden />
            <div className="landing-page__preview-card landing-page__preview-card--back" />
            <div className="landing-page__preview-card landing-page__preview-card--front">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF6B00]">
                Nuestra misión
              </p>
              <p className="mb-6 text-lg font-semibold leading-snug text-white">
                Devolverle a cada cliente el control sobre su operación digital.
              </p>
              <ul className="space-y-3">
                {MISSION_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/60"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-page__cta-band relative z-10 mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="landing-page__cta-band-inner rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            ¿Listo para recuperar el control?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Si ya sos cliente o parte del equipo Raptor, ingresá al portal. Si
            querés conocernos, estamos para escuchar tu caso y proponerte un
            camino concreto.
          </p>
          <div className="mt-8">
            <Link href="/login" className="inline-flex">
              <Button size="lg" className="landing-page__cta min-w-[220px] font-semibold">
                Entrar
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-page__footer relative z-10 border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:px-10 sm:text-left">
          <RaptorSolutionsLogo className="h-6 w-auto text-white/80" />
          <p className="max-w-md text-xs leading-relaxed text-white/35">
            Raptor Solutions — apps y tecnología configurable para empresas que
            quieren operar con orden y control.
          </p>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Raptor Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}
