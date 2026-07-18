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

export const LANDING_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@raptorsolutions.com";

export const PILLARS = [
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

export const VALUES = [
  { value: "360°", label: "Enfoque integral" },
 
  { value: "24/7", label: "Compromiso continuo" },
  { value: "100%", label: "Orientados a resultados" },
] as const;

export const OFFERINGS = [
  {
    icon: Cubes3Overlap,
    title: "Aplicaciones que prestamos",
    text: "Ponemos a disposición soluciones listas para operar. No partes de cero: activamos lo que tu negocio necesita y la plataforma se ajusta a tu forma de trabajar.",
  },
  {
    icon: Sliders,
    title: "Configuración a tu medida",
    text: "Adaptamos módulos, accesos y reglas de negocio para que la plataforma encaje con tu operación real, sin partir de cero.",
  },
  {
    icon: Code,
    title: "Desarrollo a medida",
    text: "Cuando tu caso lo requiere, diseñamos y construimos soluciones propias: integraciones, flujos o herramientas pensadas exclusivamente para tu negocio.",
  },
  {
    icon: Eye,
    title: "Gobierno de aplicaciones",
    text: "Supervisamos y coordinamos el ecosistema digital de tu negocio para que todo funcione alineado a tus objetivos.",
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

export const APPROACH = [
  {
    step: "01",
    title: "Escuchamos y diagnosticamos",
    text: "Conocemos tu operación, tus plataformas y tus cuellos de botella antes de proponer cualquier cambio.",
  },
  {
    step: "02",
    title: "Diseñamos la solución",
    text: "Definimos si conviene activar una solución existente, configurarla o desarrollar algo a medida — siempre con un plan claro y medible.",
  },
  {
    step: "03",
    title: "Implementamos y acompañamos",
    text: "Ejecutamos con rigor y nos quedamos cerca para asegurar que la solución funcione en la práctica.",
  },
] as const;

export const MISSION_POINTS = [
  "Soluciones listas que se adaptan a cada negocio",
  "Desarrollo a medida cuando el caso lo pide",
  "Control centralizado de tu operación digital",
  "Acompañamiento continuo, no un proyecto y chau",
] as const;
