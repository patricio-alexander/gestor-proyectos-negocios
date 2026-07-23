/**
 * Seed catálogo móvil ChilePan (solo gestor / channel=mobile).
 * Todo lo aún no programado en la app → status planned (= «Próximamente»).
 *
 *   npx tsx scripts/seed-chilepan-mobile-catalog.ts
 */
import { prisma } from "../src/shared/lib/prisma";
import { Period } from "../prisma/generated/prisma/enums";

const CONTROL_APP_ID = 4; // ChilePan Apps#

/**
 * Catálogo a definir en el gestor antes de bajar a la app.
 * Ventas / Inventario / Finanzas / Sistema / Comprobantes electrónicos:
 * mismo contexto de secciones que EdDeli.
 * Impresión: conexiones, márgenes y archivos (no son módulos aparte).
 *
 * status planned = Próximamente (aún no en la app móvil).
 */
const MOBILE_MODULES = [
  {
    key: "mobile_impresion",
    name: "Impresión",
    description:
      "Impresión térmica: conexiones, márgenes/formatos y archivos a imprimir.",
    /** Ya programado en ChilePan */
    status: "active" as const,
    sections: [
      {
        key: "/impresion/bluetooth",
        name: "Bluetooth",
        status: "active" as const,
      },
      { key: "/impresion/wifi", name: "Wi‑Fi", status: "active" as const },
      { key: "/impresion/nfc", name: "NFC", status: "active" as const },
      {
        key: "/impresion/margenes",
        name: "Márgenes y formatos",
        status: "active" as const,
      },
      {
        key: "/impresion/archivos",
        name: "Archivos",
        status: "active" as const,
      },
    ],
  },
  {
    key: "mobile_ventas",
    name: "Ventas",
    description:
      "Pedidos, clientes y (próx.) clientes con cuenta — contexto EdDeli.",
    status: "planned" as const,
    sections: [
      { key: "/ventas/pedidos", name: "Pedidos", status: "planned" as const },
      { key: "/ventas/clientes", name: "Clientes", status: "planned" as const },
      {
        key: "/ventas/clientes/cuentas",
        name: "Clientes con cuenta",
        status: "planned" as const,
      },
    ],
  },
  {
    key: "mobile_inventario",
    name: "Inventario",
    description:
      "Catálogo, stock, (próx.) bodegas y lotes — contexto EdDeli.",
    status: "planned" as const,
    sections: [
      {
        key: "/inventario/productos",
        name: "Productos",
        status: "planned" as const,
      },
      {
        key: "/inventario/movimientos",
        name: "Movimientos",
        status: "planned" as const,
      },
      {
        key: "/inventario/categorias",
        name: "Categorías",
        status: "planned" as const,
      },
      { key: "/inventario/tramos", name: "Tramos", status: "planned" as const },
      {
        key: "/inventario/unidades",
        name: "Unidades",
        status: "planned" as const,
      },
      { key: "/inventario/bodegas", name: "Bodegas", status: "planned" as const },
      {
        key: "/inventario/lotes",
        name: "Lotes y vencimientos",
        status: "planned" as const,
      },
    ],
  },
  {
    key: "mobile_finanzas",
    name: "Finanzas",
    description:
      "Ingresos, cobros, gastos y cuentas por pagar — contexto EdDeli.",
    status: "planned" as const,
    sections: [
      {
        key: "/finanzas/movimientos",
        name: "Finanzas",
        status: "planned" as const,
      },
      {
        key: "/finanzas/cobranzas",
        name: "Cobranzas",
        status: "planned" as const,
      },
      {
        key: "/finanzas/prestamos-deudas",
        name: "Préstamos y deudas",
        status: "planned" as const,
      },
      {
        key: "/finanzas/gastos-recurrentes",
        name: "Gastos recurrentes",
        status: "planned" as const,
      },
    ],
  },
  {
    key: "mobile_sistema",
    name: "Sistema",
    description:
      "Configuración, perfil, planes, módulos, notificaciones y donaciones — contexto EdDeli.",
    status: "active" as const,
    sections: [
      {
        key: "/sistema/configuracion",
        name: "Configuración",
        status: "planned" as const,
      },
      {
        key: "/sistema/notificaciones",
        name: "Notificaciones",
        status: "planned" as const,
      },
      { key: "/sistema/planes", name: "Planes", status: "active" as const },
      { key: "/sistema/modulos", name: "Módulos", status: "active" as const },
      { key: "/sistema/perfil", name: "Perfil", status: "active" as const },
      {
        key: "/sistema/donaciones",
        name: "Donaciones",
        status: "planned" as const,
      },
    ],
  },
  {
    key: "mobile_comprobantes_electronicos",
    name: "Comprobantes electrónicos",
    description:
      "Documentos tributarios: facturas, notas, retenciones y guías — contexto EdDeli.",
    status: "planned" as const,
    sections: [
      {
        key: "/comprobantes-electronicos",
        name: "Inicio SRI",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/facturas",
        name: "Facturas",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/notas-venta",
        name: "Notas de venta",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/notas-credito",
        name: "Notas de crédito",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/notas-debito",
        name: "Notas de débito",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/retenciones",
        name: "Retenciones",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/guias-remision",
        name: "Guías de remisión",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/liquidacion-compras",
        name: "Liquidación de compras",
        status: "planned" as const,
      },
      {
        key: "/comprobantes-electronicos/emitidos",
        name: "Documentos emitidos",
        status: "planned" as const,
      },
    ],
  },
] as const;

const OBSOLETE_MODULE_KEYS = [
  "mobile_archivos",
  "mobile_formatos",
  "mobile_catalogo",
  "mobile_pedidos",
];

const MOBILE_PLANS: {
  name: string;
  sort_order: number;
  monthly: number;
  annual: number;
  legacyNames?: string[];
}[] = [
  {
    name: "Plan Gratis",
    sort_order: 1,
    monthly: 0,
    annual: 0,
    legacyNames: ["ChilePan Prueba"],
  },
  {
    name: "Plan Pro",
    sort_order: 2,
    monthly: 69,
    annual: 690,
    legacyNames: ["ChilePan Básico", "ChilePan Taller", "ChilePan Comercio"],
  },
  {
    name: "Plan Socios",
    sort_order: 3,
    monthly: 99,
    annual: 990,
    legacyNames: ["ChilePan Redes", "ChilePan Empresarial"],
  },
];

const OBSOLETE_MOBILE_PLAN_NAMES = [
  "ChilePan Prueba",
  "ChilePan Básico",
  "ChilePan Taller",
  "ChilePan Comercio",
  "ChilePan Redes",
  "ChilePan Empresarial",
];

async function ensureModule(def: (typeof MOBILE_MODULES)[number]) {
  let mod = await prisma.module.findFirst({
    where: { key: def.key },
  });

  if (!mod) {
    mod = await prisma.module.create({
      data: {
        key: def.key,
        name: def.name,
        description: def.description,
        channel: "mobile",
        status: def.status,
        sections: {
          create: def.sections.map((s) => ({
            key: s.key,
            name: s.name,
            status: s.status,
          })),
        },
      },
    });
    console.log(`  + Module ${def.key} (#${mod.id}) [${def.status}]`);
  } else {
    mod = await prisma.module.update({
      where: { id: mod.id },
      data: {
        channel: "mobile",
        deleted_at: null,
        name: def.name,
        description: def.description,
        status: def.status,
      },
    });
    console.log(`  ~ Module ${def.key} (#${mod.id}) [${def.status}]`);
  }

  const wantKeys = new Set(def.sections.map((s) => s.key));

  for (const s of def.sections) {
    const existing = await prisma.section.findFirst({
      where: { module_id: mod.id, key: s.key },
    });
    if (!existing) {
      await prisma.section.create({
        data: {
          module_id: mod.id,
          key: s.key,
          name: s.name,
          status: s.status,
        },
      });
    } else {
      await prisma.section.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          status: s.status,
          deleted_at: null,
        },
      });
    }
  }

  const stale = await prisma.section.findMany({
    where: {
      module_id: mod.id,
      deleted_at: null,
      key: { notIn: [...wantKeys] },
    },
  });
  for (const row of stale) {
    await prisma.section.update({
      where: { id: row.id },
      data: { deleted_at: new Date() },
    });
    console.log(`    - sección obsoleta ${row.key}`);
  }

  return mod;
}

async function ensureAppModule(appId: number, moduleId: number) {
  const existing = await prisma.appModule.findFirst({
    where: { app_id: appId, module_id: moduleId },
  });
  if (existing) return existing;
  return prisma.appModule.create({
    data: { app_id: appId, module_id: moduleId, status: "active" },
  });
}

async function ensurePlan(
  def: (typeof MOBILE_PLANS)[number],
  allModuleIds: number[],
  appId: number,
) {
  let plan = await prisma.plan.findFirst({
    where: { name: def.name, channel: "mobile", deleted_at: null },
  });

  if (!plan && def.legacyNames?.length) {
    plan = await prisma.plan.findFirst({
      where: {
        channel: "mobile",
        name: { in: def.legacyNames },
        deleted_at: null,
      },
    });
    if (plan) {
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: def.name,
          sort_order: def.sort_order,
          channel: "mobile",
          deleted_at: null,
        },
      });
      console.log(`  ~ Plan renombrado → ${def.name} (#${plan.id})`);
    }
  }

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: def.name,
        channel: "mobile",
        sort_order: def.sort_order,
        prices: {
          create: [
            { price: def.monthly, period: Period.MONTHLY },
            { price: def.annual, period: Period.ANNUALLY },
          ],
        },
      },
    });
    console.log(`  + Plan ${def.name} (#${plan.id})`);
  } else {
    await prisma.plan.update({
      where: { id: plan.id },
      data: { sort_order: def.sort_order, name: def.name },
    });
    for (const period of [
      { period: Period.MONTHLY, price: def.monthly },
      { period: Period.ANNUALLY, price: def.annual },
    ]) {
      const row = await prisma.planPrice.findFirst({
        where: { plan_id: plan.id, period: period.period },
      });
      if (!row) {
        await prisma.planPrice.create({
          data: {
            plan_id: plan.id,
            period: period.period,
            price: period.price,
          },
        });
      } else {
        await prisma.planPrice.update({
          where: { id: row.id },
          data: { price: period.price },
        });
      }
    }
    console.log(`  = Plan ${def.name} (#${plan.id})`);
  }

  const wantAmIds = new Set<number>();
  for (const moduleId of allModuleIds) {
    const am = await ensureAppModule(appId, moduleId);
    wantAmIds.add(am.id);
    const link = await prisma.planAppModule.findFirst({
      where: { plan_id: plan.id, app_module_id: am.id },
    });
    if (!link) {
      await prisma.planAppModule.create({
        data: { plan_id: plan.id, app_module_id: am.id },
      });
    }
  }

  const existing = await prisma.planAppModule.findMany({
    where: { plan_id: plan.id },
    include: { app_module: { select: { app_id: true } } },
  });
  for (const row of existing) {
    if (row.app_module.app_id !== appId) continue;
    if (!wantAmIds.has(row.app_module_id)) {
      await prisma.planAppModule.delete({
        where: {
          plan_id_app_module_id: {
            plan_id: plan.id,
            app_module_id: row.app_module_id,
          },
        },
      });
    }
  }

  return plan;
}

async function main() {
  const controlApp = await prisma.apps.findFirst({
    where: { id: CONTROL_APP_ID, kind: "mobile", deleted_at: null },
  });
  if (!controlApp) {
    throw new Error(`Apps#${CONTROL_APP_ID} (ChilePan mobile) no encontrada`);
  }

  console.log("Módulos móviles (gestor · Próximamente)…");
  const moduleIds: number[] = [];
  for (const def of MOBILE_MODULES) {
    const mod = await ensureModule(def);
    moduleIds.push(mod.id);
    await ensureAppModule(controlApp.id, mod.id);
  }

  const obsoleteMods = await prisma.module.updateMany({
    where: {
      channel: "mobile",
      deleted_at: null,
      key: { in: OBSOLETE_MODULE_KEYS },
    },
    data: { deleted_at: new Date() },
  });
  if (obsoleteMods.count) {
    console.log(`Soft-delete módulos viejos: ${obsoleteMods.count}`);
  }

  console.log("Planes móviles (Gratis / Pro / Socios)…");
  for (const def of MOBILE_PLANS) {
    await ensurePlan(def, moduleIds, controlApp.id);
  }

  const obsoletePlans = await prisma.plan.updateMany({
    where: {
      channel: "mobile",
      deleted_at: null,
      name: { in: OBSOLETE_MOBILE_PLAN_NAMES },
    },
    data: { deleted_at: new Date() },
  });
  if (obsoletePlans.count) {
    console.log(`Soft-delete planes ChilePan*: ${obsoletePlans.count}`);
  }

  console.log("Listo: catálogo móvil definido en gestor (todo Próximamente).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
