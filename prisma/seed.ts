import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";
import {
  DEFAULT_ROLES,
  DEFAULT_EXPORT_CAPABILITIES,
  EDDELI_PRODUCT_CATALOG,
  type CatalogModuleDef,
} from "../src/shared/config/eddeli-product-catalog";

/** Conexión y branding del seed — valores desde .env (default: raptorsolutions). */
const SEED_ENV = {
  databaseHost: process.env.DATABASE_HOST ?? "localhost",
  databaseUser: process.env.DATABASE_USER ?? "root",
  databasePassword: process.env.DATABASE_PASSWORD ?? "",
  databaseName: process.env.DATABASE_NAME ?? "raptorsolutions",
  databasePort: Number(process.env.DATABASE_PORT ?? 3306),
  platformName: "Raptor Solutions",
} as const;

const adapter = new PrismaMariaDb({
  host: SEED_ENV.databaseHost,
  user: SEED_ENV.databaseUser,
  password: SEED_ENV.databasePassword,
  database: SEED_ENV.databaseName,
  port: SEED_ENV.databasePort,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function seedRoles() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
      },
    });
  }

  const legacySuperadmin = await prisma.role.findUnique({
    where: { key: "superadmin" },
  });
  const programador = await prisma.role.findUnique({
    where: { key: "programador" },
  });
  if (legacySuperadmin && programador) {
    const links = await prisma.userRole.findMany({
      where: { role_id: legacySuperadmin.id },
    });
    for (const link of links) {
      await prisma.userRole.upsert({
        where: {
          user_id_role_id: { user_id: link.user_id, role_id: programador.id },
        },
        update: {},
        create: { user_id: link.user_id, role_id: programador.id },
      });
    }
    await prisma.userRole.deleteMany({
      where: { role_id: legacySuperadmin.id },
    });
    await prisma.role.delete({ where: { id: legacySuperadmin.id } });
  }
}

async function assignRoles(userId: string, roleKeys: string[]) {
  for (const key of roleKeys) {
    const role = await prisma.role.findUnique({ where: { key } });
    if (!role) continue;
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: userId, role_id: role.id } },
      update: {},
      create: { user_id: userId, role_id: role.id },
    });
  }
}

/** Cuentas del panel Raptor Solutions (control plane). */
async function seedPlatformAccounts() {
  const password = await bcrypt.hash("12345678", 10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { id: "edgar-torres-id" },
        { username: "administrador" },
        { username: "Administrador" },
        { username: "admin" },
        { email: "admin@mail.com" },
      ],
    },
  });

  const edgar = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: "administrador",
          email: "edgar@raptorsolutions.local",
          display_name: "Edgar Torres",
          password,
          deleted_at: null,
        },
      })
    : await prisma.user.create({
        data: {
          id: "edgar-torres-id",
          username: "administrador",
          email: "edgar@raptorsolutions.local",
          display_name: "Edgar Torres",
          password,
        },
      });

  await assignRoles(edgar.id, ["programador", "admin"]);

  const demoAccounts = [
    {
      id: "raptor-operador-id",
      username: "operador",
      email: "operador@raptorsolutions.local",
      display_name: "Operador Demo",
      roleKeys: ["operator"],
    },
    {
      id: "raptor-soporte-id",
      username: "soporte",
      email: "soporte@raptorsolutions.local",
      display_name: "Soporte Raptor Solutions",
      roleKeys: ["admin"],
    },
  ] as const;

  for (const account of demoAccounts) {
    const row = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        email: account.email,
        display_name: account.display_name,
        password,
        deleted_at: null,
      },
      create: {
        id: account.id,
        username: account.username,
        email: account.email,
        display_name: account.display_name,
        password,
      },
    });
    await assignRoles(row.id, [...account.roleKeys]);
  }
}

const EDDELI_APP_HASH = crypto
  .createHash("sha256")
  .update("eddeli-seed-app")
  .digest("hex")
  .slice(0, 32);

/** Hash legacy de la app plantilla Raptor (ya no se usa ni se crea en seed). */
const LEGACY_RAPTOR_APP_HASH = crypto
  .createHash("sha256")
  .update("raptor-template-app")
  .digest("hex")
  .slice(0, 32);

const EDDELI_API_KEY = "gc_4a177c0295a4cb88d52cea1035b9e9a5";

const EDDELI_ENTITLEMENT_URL =
  process.env.EDDELI_ENTITLEMENT_URL ||
  "http://127.0.0.1:3001/eddeliapi/subscription/entitlement";
const EDDELI_ENTITLEMENT_SECRET =
  process.env.EDDELI_ENTITLEMENT_SECRET || EDDELI_API_KEY;

async function seedEdDeliApp() {
  return prisma.apps.upsert({
    where: { hash: EDDELI_APP_HASH },
    update: {
      name: "EdDeli",
      kind: "deployment",
      deleted_at: null,
      entitlement_url: EDDELI_ENTITLEMENT_URL,
      entitlement_secret: EDDELI_ENTITLEMENT_SECRET,
    },
    create: {
      hash: EDDELI_APP_HASH,
      name: "EdDeli",
      owner_name: "EdDeli",
      email: "soporte@eddeli.com",
      kind: "deployment",
      entitlement_url: EDDELI_ENTITLEMENT_URL,
      entitlement_secret: EDDELI_ENTITLEMENT_SECRET,
    },
  });
}

/** Elimina la app Raptor legacy si quedó de seeds o migraciones anteriores. */
async function removeLegacyRaptorApp() {
  const raptor = await prisma.apps.findFirst({
    where: {
      deleted_at: null,
      OR: [{ hash: LEGACY_RAPTOR_APP_HASH }, { name: "Raptor" }],
    },
    select: { id: true, name: true },
  });
  if (!raptor) return false;

  await prisma.apps.update({
    where: { id: raptor.id },
    data: { deleted_at: new Date() },
  });
  return true;
}

async function seedSectionCapabilities(
  sectionId: number,
  capabilities: { code: string; name: string }[],
) {
  for (const cap of capabilities) {
    await prisma.capability.upsert({
      where: {
        section_id_code: { section_id: sectionId, code: cap.code },
      },
      update: { name: cap.name },
      create: {
        section_id: sectionId,
        code: cap.code,
        name: cap.name,
      },
    });
  }
}

/** UI SoftEd: development legado → maintenance. */
function catalogStatus(
  status: CatalogModuleDef["status"] | undefined,
): "active" | "maintenance" | "developer" | "planned" {
  if (status === "development" || status === "maintenance")
    return "maintenance";
  if (status === "developer" || status === "planned") return status;
  return "active";
}

/** Catálogo global de módulos y secciones (independiente de cualquier app). */
async function seedProductCatalog(catalog: CatalogModuleDef[]) {
  let sectionCount = 0;

  for (const modDef of catalog) {
    const modStatus = catalogStatus(modDef.status);
    const mod = await prisma.module.upsert({
      where: {
        key: modDef.key,
      },
      update: {
        name: modDef.name,
        description: modDef.description,
        status: modStatus,
        is_maintainer: false,
        deleted_at: null,
      },
      create: {
        key: modDef.key,
        name: modDef.name,
        description: modDef.description,
        status: modStatus,
        is_maintainer: false,
      },
    });

    const allowedKeys = new Set(modDef.sections.map((s) => s.key));

    for (const secDef of modDef.sections) {
      const existing = await prisma.section.findFirst({
        where: { module_id: mod.id, key: secDef.key, deleted_at: null },
      });

      let sectionId: number;

      const secStatus = catalogStatus(secDef.status);

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: {
            name: secDef.name,
            status: secStatus,
            deleted_at: null,
          },
        });
        sectionId = existing.id;
      } else {
        const softDeleted = await prisma.section.findFirst({
          where: { module_id: mod.id, key: secDef.key },
        });
        if (softDeleted) {
          await prisma.section.update({
            where: { id: softDeleted.id },
            data: {
              name: secDef.name,
              status: secStatus,
              deleted_at: null,
            },
          });
          sectionId = softDeleted.id;
        } else {
          const created = await prisma.section.create({
            data: {
              module_id: mod.id,
              key: secDef.key,
              name: secDef.name,
              status: secStatus,
            },
          });
          sectionId = created.id;
        }
      }

      if (secDef.capabilities?.length) {
        await seedSectionCapabilities(sectionId, secDef.capabilities);
      }

      sectionCount += 1;
    }

    // Secciones viejas que ya no están en el catálogo (ej. /img en sistema)
    const obsolete = await prisma.section.findMany({
      where: {
        module_id: mod.id,
        deleted_at: null,
        OR: [{ key: null }, { key: { notIn: [...allowedKeys] } }],
      },
    });
    for (const sec of obsolete) {
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: new Date() },
      });
    }
  }

  return sectionCount;
}

/** Asigna módulos del catálogo a una app vía AppModule. */
async function seedAppModules(appId: number, moduleIds: number[]) {
  for (const moduleId of moduleIds) {
    await prisma.appModule.upsert({
      where: {
        app_id_module_id: { app_id: appId, module_id: moduleId },
      },
      update: {},
      create: { app_id: appId, module_id: moduleId },
    });
  }
}

const EVENT_TYPES_SEED = [
  { key: "user.registered", name: "Registro de usuario" },
  { key: "user.login", name: "Inicio de sesión" },
  { key: "order.created", name: "Pedido creado" },
  { key: "order.confirmed", name: "Pedido confirmado" },
  { key: "order.prepared", name: "Pedido en preparación" },
  { key: "order.delivered", name: "Pedido entregado" },
  { key: "order.cancelled", name: "Pedido cancelado" },
  { key: "payment.processed", name: "Pago procesado" },
  { key: "payment.failed", name: "Pago fallido" },
  { key: "payment.refunded", name: "Pago reembolsado" },
  { key: "restaurant.opened", name: "Restaurante abierto" },
  { key: "restaurant.closed", name: "Restaurante cerrado" },
  { key: "review.created", name: "Reseña creada" },
  { key: "promotion.used", name: "Promoción usada" },
];

async function seedEventTypes() {
  const types: { id: number; key: string }[] = [];
  for (const et of EVENT_TYPES_SEED) {
    const row = await prisma.eventType.upsert({
      where: { key: et.key },
      update: { name: et.name },
      create: { key: et.key, name: et.name },
    });
    types.push({ id: row.id, key: row.key });
  }
  return types;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

const EVENT_DISTRIBUTION: Record<string, { weight: number; names: string[] }> =
  {
    "user.registered": { weight: 15, names: ["user:signup", "user:register"] },
    "user.login": { weight: 60, names: ["user:login"] },
    "order.created": { weight: 45, names: ["order:create", "order:place"] },
    "order.confirmed": { weight: 40, names: ["order:confirm"] },
    "order.prepared": {
      weight: 35,
      names: ["order:cooking", "order:preparing"],
    },
    "order.delivered": {
      weight: 38,
      names: ["order:deliver", "order:complete"],
    },
    "order.cancelled": { weight: 8, names: ["order:cancel"] },
    "payment.processed": {
      weight: 42,
      names: ["payment:success", "payment:approve"],
    },
    "payment.failed": {
      weight: 6,
      names: ["payment:decline", "payment:error"],
    },
    "payment.refunded": { weight: 4, names: ["payment:refund"] },
    "restaurant.opened": { weight: 20, names: ["restaurant:open"] },
    "restaurant.closed": { weight: 20, names: ["restaurant:close"] },
    "review.created": { weight: 18, names: ["review:write", "review:rate"] },
    "promotion.used": {
      weight: 10,
      names: ["promotion:apply", "promotion:redeem"],
    },
  };

async function seedEvents(typeMap: Map<string, number>, appIds: number[]) {
  const entries: {
    app_id: number;
    type_id: number;
    name: string;
    created_at: Date;
    metadata: any;
  }[] = [];

  for (const appId of appIds) {
    for (const [key, dist] of Object.entries(EVENT_DISTRIBUTION)) {
      const typeId = typeMap.get(key);
      if (!typeId) continue;
      const count = randomBetween(dist.weight - 5, dist.weight + 10);

      for (let i = 0; i < count; i++) {
        const name = dist.names[Math.floor(Math.random() * dist.names.length)];
        const created_at = randomDate(30);

        let metadata: any = null;
        if (key.startsWith("order.")) {
          metadata = {
            order_id: randomBetween(1000, 9999),
            amount: randomBetween(15, 200) * 1000,
            items: randomBetween(1, 8),
          };
        } else if (key.startsWith("payment.")) {
          metadata = {
            transaction_id: `txn_${crypto.randomBytes(8).toString("hex")}`,
            amount: randomBetween(10, 250) * 1000,
            method: ["credit_card", "debit_card", "cash", "transfer"][
              randomBetween(0, 3)
            ],
          };
        } else if (key.startsWith("user.")) {
          metadata = { user_id: randomBetween(1, 500) };
        } else if (key.startsWith("restaurant.")) {
          metadata = { restaurant_id: randomBetween(1, 50) };
        } else if (key === "review.created") {
          metadata = {
            order_id: randomBetween(1000, 9999),
            rating: randomBetween(1, 5),
          };
        } else if (key === "promotion.used") {
          metadata = {
            code: `PROMO${randomBetween(100, 999)}`,
            discount: randomBetween(5, 50) * 1000,
          };
        }

        entries.push({
          app_id: appId,
          type_id: typeId,
          name,
          created_at,
          metadata,
        });
      }
    }
  }

  for (const entry of entries) {
    await prisma.event.create({ data: entry });
  }

  return entries.length;
}

/** Módulos por plan comercial EdDeli (System → Planes). */
const EDDELI_PLAN_DEFS: {
  name: string;
  sortOrder: number;
  monthlyPrice: number;
  moduleKeys: string[] | "ALL";
}[] = [
  {
    name: "Plan Prueba",
    sortOrder: 1,
    monthlyPrice: 0,
    moduleKeys: [
      "dashboard",
      "notificaciones",
      "operacion",
      "ventas",
      "finanzas",
      "inventario",
      "produccion",
      "administracion",
      "sistema",
    ],
  },
  {
    name: "Plan Básico",
    sortOrder: 2,
    monthlyPrice: 19,
    moduleKeys: [
      "dashboard",
      "notificaciones",
      "operacion",
      "administracion",
      "sistema",
    ],
  },
  {
    name: "Plan Medio",
    sortOrder: 3,
    monthlyPrice: 39,
    moduleKeys: [
      "dashboard",
      "notificaciones",
      "operacion",
      "ventas",
      "finanzas",
      "inventario",
      "produccion",
      "administracion",
      "sistema",
    ],
  },
  {
    name: "Plan Pro",
    sortOrder: 4,
    monthlyPrice: 69,
    moduleKeys: [
      "dashboard",
      "notificaciones",
      "operacion",
      "ventas",
      "finanzas",
      "inventario",
      "produccion",
      "canal_digital",
      "publicidad",
      "diseno_promocional",
      "administracion",
      "sistema",
    ],
  },
  {
    name: "Plan Socios",
    sortOrder: 5,
    monthlyPrice: 99,
    moduleKeys: "ALL",
  },
  {
    name: "Plan Empresarial",
    sortOrder: 6,
    monthlyPrice: 149,
    moduleKeys: "ALL",
  },
];

async function syncPlanAppModulesForApp(
  planId: number,
  appId: number,
  moduleIds: number[],
) {
  const existing = await prisma.planAppModule.findMany({
    where: { plan_id: planId },
    select: {
      app_module: { select: { module_id: true, app_id: true } },
    },
  });
  const want = new Set(moduleIds);
  for (const row of existing) {
    if (row.app_module.app_id !== appId) continue;
    if (!want.has(row.app_module.module_id)) {
      await prisma.planAppModule.deleteMany({
        where: {
          plan_id: planId,
          app_module: {
            app_id: appId,
            module_id: row.app_module.module_id,
          },
        },
      });
    }
  }

  for (const moduleId of moduleIds) {
    const appModule = await prisma.appModule.upsert({
      where: {
        app_id_module_id: { app_id: appId, module_id: moduleId },
      },
      update: {},
      create: { app_id: appId, module_id: moduleId },
    });
    await prisma.planAppModule.upsert({
      where: {
        plan_id_app_module_id: {
          plan_id: planId,
          app_module_id: appModule.id,
        },
      },
      update: {},
      create: { plan_id: planId, app_module_id: appModule.id },
    });
  }
}

/** Los 6 planes comerciales de EdDeli + precios mensuales + módulos. */
async function seedEdDeliCommercialPlans(appId: number) {
  const allModules = await prisma.module.findMany({
    where: { deleted_at: null },
    select: { id: true, key: true },
  });
  const byKey = new Map(allModules.map((m) => [m.key, m.id]));

  const created: { id: number; name: string; modules: number }[] = [];

  for (const def of EDDELI_PLAN_DEFS) {
    let plan = await prisma.plan.findFirst({
      where: {
        name: def.name,
        deleted_at: null,
      },
    });

    // Renombrar el plan "Socios" suelto (seed previo) a "Plan Socios"
    if (!plan && def.name === "Plan Socios") {
      plan = await prisma.plan.findFirst({
        where: {
          OR: [{ name: "Socios" }, { name: "Local Dev" }],
          deleted_at: null,
        },
      });
      if (plan) {
        plan = await prisma.plan.update({
          where: { id: plan.id },
          data: { name: "Plan Socios", deleted_at: null },
        });
      }
    }

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: def.name,
          sort_order: def.sortOrder,
        },
      });
    } else {
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: def.name,
          deleted_at: null,
          sort_order: def.sortOrder,
        },
      });
    }

    const moduleIds =
      def.moduleKeys === "ALL"
        ? allModules.map((m) => m.id)
        : def.moduleKeys
            .map((k) => byKey.get(k))
            .filter((id): id is number => typeof id === "number");

    await syncPlanAppModulesForApp(plan.id, appId, moduleIds);

    let planPrice = await prisma.planPrice.findFirst({
      where: { plan_id: plan.id, period: "MONTHLY" },
    });
    if (!planPrice) {
      await prisma.planPrice.create({
        data: {
          plan_id: plan.id,
          period: "MONTHLY",
          price: def.monthlyPrice,
        },
      });
    } else {
      await prisma.planPrice.update({
        where: { id: planPrice.id },
        data: { price: def.monthlyPrice },
      });
    }

    // Precio anual opcional (~10 meses)
    let annual = await prisma.planPrice.findFirst({
      where: { plan_id: plan.id, period: "ANNUALLY" },
    });
    const annualPrice = def.monthlyPrice * 10;
    if (!annual) {
      await prisma.planPrice.create({
        data: {
          plan_id: plan.id,
          period: "ANNUALLY",
          price: annualPrice,
        },
      });
    } else {
      await prisma.planPrice.update({
        where: { id: annual.id },
        data: { price: annualPrice },
      });
    }

    created.push({ id: plan.id, name: def.name, modules: moduleIds.length });
  }

  return created;
}

/** Suscripción ACTIVE al Plan Socios (todos los módulos) para pruebas locales. */
async function seedEdDeliLocalSubscription(appHash: string) {
  const plan = await prisma.plan.findFirst({
    where: {
      name: "Plan Socios",
      deleted_at: null,
    },
  });
  if (!plan) {
    throw new Error(
      "Plan Socios no encontrado; corre seedEdDeliCommercialPlans antes",
    );
  }

  let planPrice = await prisma.planPrice.findFirst({
    where: { plan_id: plan.id, period: "MONTHLY" },
  });
  if (!planPrice) {
    planPrice = await prisma.planPrice.create({
      data: { plan_id: plan.id, period: "MONTHLY", price: 99 },
    });
  }

  const startAt = new Date();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  let subscription = await prisma.subscription.findFirst({
    where: { app_hash: appHash },
  });
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        app_hash: appHash,
        plan_price_id: planPrice.id,
        status: "ACTIVE",
        start_at: startAt,
        expires_at: expiresAt,
      },
    });
  } else {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan_price_id: planPrice.id,
        status: "ACTIVE",
        start_at: startAt,
        expires_at: expiresAt,
      },
    });
  }

  const moduleCount = await prisma.planAppModule.count({
    where: { plan_id: plan.id },
  });

  return {
    planId: plan.id,
    planName: plan.name!,
    subscriptionId: subscription.id,
    modules: moduleCount,
  };
}

async function main() {
  console.log("Seed %s → BD `%s`", SEED_ENV.platformName, SEED_ENV.databaseName);

  await seedRoles();
  await seedPlatformAccounts();
  const removedRaptor = await removeLegacyRaptorApp();
  const eddeliApp = await seedEdDeliApp();
  const sectionCount = await seedProductCatalog(EDDELI_PRODUCT_CATALOG);

  const allModules = await prisma.module.findMany({
    where: { deleted_at: null },
    select: { id: true },
  });
  await seedAppModules(
    eddeliApp.id,
    allModules.map((m) => m.id),
  );

  const commercialPlans = await seedEdDeliCommercialPlans(eddeliApp.id);
  const localSub = await seedEdDeliLocalSubscription(EDDELI_APP_HASH);

  // Empuja entitlement al backend EdDeli (si está corriendo).
  const { pushEntitlementToApp } =
    await import("../src/shared/lib/push-entitlement");
  const push = await pushEntitlementToApp(EDDELI_APP_HASH);

  console.log(
    "Seed OK [%s]: roles, catálogo global (%d módulos, %d secciones), EdDeli, cuentas%s",
    SEED_ENV.databaseName,
    EDDELI_PRODUCT_CATALOG.length,
    sectionCount,
    removedRaptor ? " · Raptor legacy eliminada" : "",
  );
  console.log(
    "  Planes: %s",
    commercialPlans.map((p) => `${p.name}(${p.modules}m)`).join(", "),
  );
  console.log(
    "  Suscripción local: %s (%d módulos) → sub %d",
    localSub.planName,
    localSub.modules,
    localSub.subscriptionId,
  );
  console.log(
    "  Entitlement push: %s",
    push.skipped
      ? "omitido (sin URL)"
      : push.ok
        ? "OK → EdDeli backend"
        : `falló (${push.error || push.status}) — arranca EdDeli y vuelve a seed o haz pull`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
