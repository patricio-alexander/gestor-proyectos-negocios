/**
 * Noticias de portada + una página de detalle por ítem (mismo orden).
 * Uso: npx tsx scripts/refresh-sample-news.ts
 */
import "dotenv/config";
import { prisma } from "../src/shared/lib/prisma";
import { pushNewsToAppIds } from "../src/features/news/lib/news-service";

const APP_IDS = [1, 2, 6];

const NEWS = [
  {
    kind: "portada" as const,
    sort_order: 0,
    title: "Llegó la nueva sección de Noticias",
    subtitle: "Para enterarte de las novedades y mantenerte informado",
    body:
      "Desde hoy el sistema tiene un espacio tipo periódico con las novedades.\n\nEn portada verás el resumen de lo más útil y lo reciente. En las páginas siguientes, cada tema tiene su propia hoja con más detalle: primero lo del día a día (Caja, turnos, Cobranzas, Pedidos), luego esta misma sección de Noticias ampliada, lo que se mejoró en Operación y Caja, y al final lo que se viene.",
  },

  // Portada pág. 1 — 4 cards (detalle = páginas 3–6)
  {
    kind: "breve" as const,
    sort_order: 10,
    title: "Caja",
    subtitle: "Ventas en el mostrador",
    body:
      "La sección de Caja concentra la venta del día a día: líneas del ticket, cobro rápido y control de lo que sale del mostrador.\n\nCuando están activos, también permite descuentos porcentuales por línea o sobre toda la compra, sin cambiar el flujo habitual hasta que se habiliten en configuración.",
  },
  {
    kind: "breve" as const,
    sort_order: 11,
    title: "Control de inventario",
    subtitle: "Abrir y cerrar turno",
    body:
      "Desde control de inventario se abre y se cierra el turno del local.\n\nSirve para llevar el recuento y el cierre del día de forma ordenada: saber con qué stock se inicia, qué movimiento hubo y cómo queda al cerrar el turno.",
  },
  {
    kind: "breve" as const,
    sort_order: 12,
    title: "Cobranzas",
    subtitle: "Cuentas por cobrar",
    body:
      "Cobranzas permite seguir saldos, abonos y el estado de las cuentas de los clientes.\n\nDesde ahí también se puede trabajar con los pedidos asociados, manteniendo el desglose real (por ejemplo pacas) al revisar o editar.",
  },
  {
    kind: "breve" as const,
    sort_order: 13,
    title: "Pedidos",
    subtitle: "Clientes y proveedores",
    body:
      "En Pedidos se gestionan las órdenes de clientes y de proveedores con un desglose claro.\n\nAl editar, se conservan las pacas y cada una se puede abrir o cerrar por su cuenta, sin que una afecte a las demás.",
  },

  // Portada pág. 2 — hechos (detalle después de primera plana)
  {
    kind: "breve" as const,
    sort_order: 20,
    title: "Sección de Noticias",
    subtitle: "Lo más nuevo",
    body: "Diario interno para novedades y avisos del sistema.",
  },
  {
    kind: "breve" as const,
    sort_order: 21,
    title: "Comprobantes",
    subtitle: "Módulo Operación",
    body:
      "En el módulo Operación se resumió el nombre de la sección: dejó de llamarse «Comprobantes electrónicos» y quedó simplemente como «Comprobantes».\n\nMisma función, etiqueta más corta y clara en el menú.",
  },
  {
    kind: "breve" as const,
    sort_order: 22,
    title: "Pacas en Cobranzas",
    subtitle: "Al editar pedidos",
    body:
      "Al abrir un pedido desde Cobranzas o Pedidos, el desglose de pacas se mantiene completo.\n\nCada paca colapsa o se expande de forma independiente: tocar una ya no cierra las demás.",
  },
  {
    kind: "breve" as const,
    sort_order: 23,
    title: "Descuentos % en Caja",
    subtitle: "Por línea y por compra",
    body:
      "Se agregó descuento porcentual por línea del ticket y un descuento % sobre toda la compra.\n\nQueda detrás de un interruptor en Configuración de Inventario (apagado por defecto), para no cambiar el flujo actual hasta que lo activen.",
  },

  // Próximamente (últimas páginas de detalle)
  {
    kind: "proximamente" as const,
    sort_order: 90,
    title: "Rol Dueño",
    subtitle: "Más funciones integradas",
    body:
      "Se añadirá el rol Dueño, pensado para quien administra el negocio con más funciones integradas.\n\nSe mantendrán los roles Administrador y Empleado. El rol Programador quedará reservado solo para asistencia técnica.",
  },
  {
    kind: "proximamente" as const,
    sort_order: 91,
    title: "Enlace con QR y código de barras",
    subtitle: "Pedidos entre sistemas",
    body:
      "Se creará un enlace entre instalaciones del sistema usando código QR o código de barras.\n\nLa idea es pasar pedidos de forma ágil entre locales o sistemas sin reescribir todo a mano.",
  },
];

async function main() {
  const now = new Date();

  await prisma.newsItem.updateMany({
    where: { deleted_at: null },
    data: { deleted_at: now, is_published: false },
  });

  for (const n of NEWS) {
    await prisma.newsItem.create({
      data: {
        title: n.title,
        subtitle: n.subtitle,
        body: n.body,
        kind: n.kind,
        sort_order: n.sort_order,
        is_published: true,
        published_at: now,
        targets: {
          create: APP_IDS.map((app_id) => ({ app_id })),
        },
      },
    });
  }

  console.log(`Creadas ${NEWS.length} noticias publicadas.`);
  const push = await pushNewsToAppIds(APP_IDS);
  for (const r of push) {
    console.log(
      r.ok
        ? `OK  app ${r.app_id} ${r.app_name}`
        : `FAIL app ${r.app_id} ${r.app_name}: ${r.error || r.status}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
