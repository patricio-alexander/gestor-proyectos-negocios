"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import ArrowRight from "@gravity-ui/icons/ArrowRight";
import Envelope from "@gravity-ui/icons/Envelope";
import {
  APPROACH,
  LANDING_CONTACT_EMAIL,
  MISSION_POINTS,
  OFFERINGS,
  PILLARS,
  VALUES,
} from "../data/content";
import { useLandingTheme } from "../hooks/useLandingTheme";
import { RaptorBrand } from "./RaptorBrand";

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
        <RaptorBrand variant="header" asLink />
        <Link href="/login" className="inline-flex">
          <Button
            size="sm"
            variant="secondary"
            className="landing-page__header-cta border-white/12 bg-white/6 text-white backdrop-blur-md"
          >
            Entrar
            <ArrowRight width={14} height={14} />
          </Button>
        </Link>
      </header>

      <section className="landing-page__hero relative z-10 mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-6 text-center sm:px-10">
        <div className="landing-page__logo-wrap mb-8 sm:mb-10">
          <div className="landing-page__logo-glow" aria-hidden />
          <RaptorBrand variant="hero" className="relative z-10" />
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
          Somos Raptor Solutions: prestamos soluciones que se
          adaptan a cada cliente, con el control y la visibilidad que tu negocio
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

        
      </section>

      <section className="landing-page__stats relative z-10 border-y border-white/8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/6 sm:grid-cols-3">
          {VALUES.map(({ value, label }) => (
            <div key={label} className="landing-page__stat px-6 py-8 text-center">
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

      <section className="landing-page__section landing-page__section--muted relative z-10 border-y border-white/8">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
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

          <div className="landing-page__mission">
            <div className="landing-page__mission-glow" aria-hidden />
            <div className="landing-page__mission-stack">
              <div className="landing-page__mission-card landing-page__mission-card--back" aria-hidden />
              <article className="landing-page__mission-card landing-page__mission-card--front">
                <p className="landing-page__mission-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF6B00]">
                  Nuestra misión
                </p>
                <h3 className="mb-5 text-lg font-semibold leading-snug text-white sm:text-xl">
                  Devolverle a cada cliente el control sobre su operación digital.
                </h3>
                <ul className="space-y-2.5">
                  {MISSION_POINTS.map((point) => (
                    <li
                      key={point}
                      className="landing-page__mission-item flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm leading-relaxed text-white/65"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
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
            termina de dominar. Nosotros entramos con plataformas probadas, las
            configuramos según tu operación y te acompañamos para que todo
            funcione en la práctica.
          </p>
        </div>

        <div className="landing-page__about rounded-3xl p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-white/60 sm:text-base">
            Prestamos aplicaciones que ya funcionan y las adaptamos a tus necesidades, y
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
              Aplicaciones que prestamos, configuramos o desarrollamos para ti
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
              Soluciones listas para operar, configuración flexible y desarrollo a
              medida cuando tu negocio necesita algo que aún no existe. Tú
              eliges el camino; nosotros lo ejecutamos.
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

      <section className="landing-page__cta-band relative z-10 mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="landing-page__cta-band-inner rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            ¿Listo para recuperar el control?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Si ya eres cliente o parte del equipo Raptor, ingresa al portal. Si
            quieres conocernos, escríbenos y te proponemos un camino concreto.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="inline-flex">
              <Button size="lg" className="landing-page__cta min-w-[220px] font-semibold">
                Entrar
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
            <a href={`mailto:${LANDING_CONTACT_EMAIL}`} className="inline-flex">
              <Button
                size="lg"
                variant="secondary"
                className="landing-page__cta-secondary min-w-[220px] border-white/12 bg-white/6 font-semibold text-white backdrop-blur-md"
              >
                <Envelope width={18} height={18} />
                {LANDING_CONTACT_EMAIL}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="landing-page__footer relative z-10 border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:px-10 sm:text-left">
          <RaptorBrand variant="footer" />
          <p className="max-w-md text-xs leading-relaxed text-white/45">
            Raptor Solutions — aplicaciones y tecnología configurable para empresas que
            quieren operar con orden y control.
          </p>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Raptor Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}
