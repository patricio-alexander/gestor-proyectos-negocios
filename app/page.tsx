import type { Metadata } from "next";
import { LandingPage } from "@/src/features/landing/components/LandingPage";

export const metadata: Metadata = {
  title: "Raptor Solutions",
  description: "Plataforma de gestión de licencias y proyectos de negocio",
};

export default function Home() {
  return <LandingPage />;
}
