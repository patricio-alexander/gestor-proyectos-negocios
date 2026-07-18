import type { Metadata } from "next";
import { LandingPage } from "@/src/features/landing/components/LandingPage";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Raptor Solutions — Tecnología para negocios que escalan",
  description:
    "Prestamos aplicaciones y soluciones configurables que se adaptan a cada negocio. Rendimiento, rentabilidad y control de tu operación digital.",
  openGraph: {
    title: "Raptor Solutions",
    description:
      "Soluciones listas, configuración a medida y desarrollo cuando lo necesitas. Un partner tecnológico orientado a resultados.",
    url: `${siteUrl}${basePath}`,
    siteName: "Raptor Solutions",
    locale: "es",
    type: "website",
    images: [
      {
        url: `${basePath}/eye-logo-raptor-solutions.svg`,
        width: 260,
        height: 93,
        alt: "Raptor Solutions",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Raptor Solutions",
    description:
      "Tecnología para negocios que escalan. Aplicaciones, configuración y desarrollo a medida.",
  },
};

export default function Home() {
  return <LandingPage />;
}
