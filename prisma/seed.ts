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
import { EVENT_TYPES_SEED } from "./event-types-seed";

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

const STORE_APP_HASH = crypto
  .createHash("sha256")
  .update("store-seed-app")
  .digest("hex")
  .slice(0, 32);

/** Hash legacy de la app plantilla Raptor (ya no se usa ni se crea en seed). */
const LEGACY_RAPTOR_APP_HASH = crypto
  .createHash("sha256")
  .update("raptor-template-app")
  .digest("hex")
  .slice(0, 32);

const EDDELI_API_KEY = "gc_4a177c0295a4cb88d52cea1035b9e9a5";
/** Default secret Store (alineado a GESTOR_SYNC_SECRET típico). Override: STORE_ENTITLEMENT_SECRET */
const STORE_API_KEY = "gc_46ba297fd7a64b1dde02252adc16d936";

/** Producción (default del seed). Override local: EDDELI_ENTITLEMENT_URL=http://127.0.0.1:3001/... */
const EDDELI_ENTITLEMENT_URL_PRODUCTION =
  "https://aplicaciones.marianosamaniego.edu.ec/eddeliapi/subscription/entitlement";

const STORE_ENTITLEMENT_URL_PRODUCTION =
  "https://aplicaciones.marianosamaniego.edu.ec/storeapi/subscription/entitlement";

const EDDELI_ENTITLEMENT_URL =
  process.env.EDDELI_ENTITLEMENT_URL?.trim() ||
  EDDELI_ENTITLEMENT_URL_PRODUCTION;

const STORE_ENTITLEMENT_URL =
  process.env.STORE_ENTITLEMENT_URL?.trim() ||
  STORE_ENTITLEMENT_URL_PRODUCTION;

const EDDELI_ENTITLEMENT_SECRET_ENV =
  process.env.EDDELI_ENTITLEMENT_SECRET?.trim() || "";

const STORE_ENTITLEMENT_SECRET_ENV =
  process.env.STORE_ENTITLEMENT_SECRET?.trim() || "";

async function seedEdDeliApp() {
  const existing = await prisma.apps.findUnique({
    where: { hash: EDDELI_APP_HASH },
  });

  if (existing) {
    const updated = await prisma.apps.update({
      where: { id: existing.id },
      data: {
        name: "EdDeli",
        kind: "deployment",
        deleted_at: null,
        entitlement_url: EDDELI_ENTITLEMENT_URL,
        ...(EDDELI_ENTITLEMENT_SECRET_ENV
          ? { entitlement_secret: EDDELI_ENTITLEMENT_SECRET_ENV }
          : {}),
      },
    });
    console.log(
      "  EdDeli entitlement_url → %s%s",
      EDDELI_ENTITLEMENT_URL,
      existing.entitlement_url !== EDDELI_ENTITLEMENT_URL
        ? ` (antes: ${existing.entitlement_url || "vacío"})`
        : "",
    );
    return updated;
  }

  return prisma.apps.create({
    data: {
      hash: EDDELI_APP_HASH,
      name: "EdDeli",
      owner_name: "EdDeli",
      email: "soporte@eddeli.com",
      kind: "deployment",
      entitlement_url: EDDELI_ENTITLEMENT_URL,
      entitlement_secret: EDDELI_ENTITLEMENT_SECRET_ENV || EDDELI_API_KEY,
    },
  });
}

async function seedStoreApp() {
  const existing = await prisma.apps.findUnique({
    where: { hash: STORE_APP_HASH },
  });

  if (existing) {
    const updated = await prisma.apps.update({
      where: { id: existing.id },
      data: {
        name: "Store",
        kind: "deployment",
        deleted_at: null,
        entitlement_url: STORE_ENTITLEMENT_URL,
        ...(STORE_ENTITLEMENT_SECRET_ENV
          ? { entitlement_secret: STORE_ENTITLEMENT_SECRET_ENV }
          : {}),
      },
    });
    console.log(
      "  Store entitlement_url → %s%s",
      STORE_ENTITLEMENT_URL,
      existing.entitlement_url !== STORE_ENTITLEMENT_URL
        ? ` (antes: ${existing.entitlement_url || "vacío"})`
        : "",
    );
    return updated;
  }

  // Si ya existe una app "Store" creada a mano (otro hash), reutilizarla.
  const byName = await prisma.apps.findFirst({
    where: { name: "Store", deleted_at: null, kind: "deployment" },
  });
  if (byName) {
    return prisma.apps.update({
      where: { id: byName.id },
      data: {
        entitlement_url: STORE_ENTITLEMENT_URL,
        entitlement_secret:
          STORE_ENTITLEMENT_SECRET_ENV ||
          byName.entitlement_secret ||
          STORE_API_KEY,
      },
    });
  }

  return prisma.apps.create({
    data: {
      hash: STORE_APP_HASH,
      name: "Store",
      owner_name: "Store",
      email: "soporte@store.local",
      kind: "deployment",
      entitlement_url: STORE_ENTITLEMENT_URL,
      entitlement_secret: STORE_ENTITLEMENT_SECRET_ENV || STORE_API_KEY,
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
  status: CatalogModuleDef["status"] | "hidden" | undefined,
): "active" | "maintenance" | "developer" | "planned" | "hidden" {
  if (status === "development" || status === "maintenance")
    return "maintenance";
  if (status === "hidden") return "hidden";
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

async function seedEventTypes() {
  const types: { id: number; key: string }[] = [];
  for (const et of EVENT_TYPES_SEED) {
    const row = await prisma.eventType.upsert({
      where: { key: et.key },
      update: { name: et.name, description: et.description },
      create: {
        key: et.key,
        name: et.name,
        description: et.description,
      },
    });
    types.push({ id: row.id, key: row.key });
  }
  return types;
}

/** Planes comerciales EdDeli (System → Planes). Por ahora todos con los mismos módulos. */
/** Planes comerciales EdDeli (System → Planes web). Distintos de los planes mobile. */
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

/** Los planes comerciales de EdDeli + precios + módulos (mismos para todos por ahora). */
async function seedEdDeliCommercialPlans(appId: number) {
  const allModules = await prisma.module.findMany({
    where: { deleted_at: null, channel: "web" },
    select: { id: true, key: true },
  });
  // Fallback si aún no hay channel en módulos
  const modules =
    allModules.length > 0
      ? allModules
      : await prisma.module.findMany({
          where: { deleted_at: null },
          select: { id: true, key: true },
        });
  const byKey = new Map(modules.map((m) => [m.key, m.id]));

  const created: { id: number; name: string; modules: number }[] = [];

  for (const def of EDDELI_PLAN_DEFS) {
    let plan = await prisma.plan.findFirst({
      where: {
        name: def.name,
        deleted_at: null,
        channel: "web",
      },
    });

    // Incluye soft-deleted web (p. ej. restaurar Básico/Medio tras un seed erróneo)
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { name: def.name, channel: "web" },
        orderBy: { id: "asc" },
      });
    }

    // Renombrar el plan "Socios" suelto (seed previo) a "Plan Socios"
    if (!plan && def.name === "Plan Socios") {
      plan = await prisma.plan.findFirst({
        where: {
          channel: "web",
          OR: [{ name: "Socios" }, { name: "Local Dev" }],
          deleted_at: null,
        },
      });
      if (plan) {
        plan = await prisma.plan.update({
          where: { id: plan.id },
          data: { name: "Plan Socios", deleted_at: null, channel: "web" },
        });
      }
    }

    // "Plan Gratis" mal creado en web → volver a Plan Prueba
    if (!plan && def.name === "Plan Prueba") {
      plan = await prisma.plan.findFirst({
        where: { name: "Plan Gratis", channel: "web", deleted_at: null },
      });
      if (plan) {
        plan = await prisma.plan.update({
          where: { id: plan.id },
          data: {
            name: "Plan Prueba",
            deleted_at: null,
            channel: "web",
            sort_order: def.sortOrder,
          },
        });
      }
    }

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: def.name,
          sort_order: def.sortOrder,
          channel: "web",
        },
      });
    } else {
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: def.name,
          deleted_at: null,
          sort_order: def.sortOrder,
          channel: "web",
        },
      });
    }

    const moduleIds =
      def.moduleKeys === "ALL"
        ? modules.map((m) => m.id)
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

/** Suscripción ACTIVE al Plan Socios (todos los módulos) para pruebas / prod seed. */
async function seedLocalSubscription(appHash: string, appLabel = "app") {
  const plan = await prisma.plan.findFirst({
    where: {
      name: "Plan Socios",
      channel: "web",
      deleted_at: null,
    },
  });
  if (!plan) {
    throw new Error(
      `Plan Socios (web) no encontrado; corre seedCommercialPlans antes (${appLabel})`,
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

  const app = await prisma.apps.findUnique({
    where: { hash: appHash },
    select: { id: true },
  });
  const moduleCount = app
    ? await prisma.planAppModule.count({
        where: { plan_id: plan.id, app_module: { app_id: app.id } },
      })
    : await prisma.planAppModule.count({ where: { plan_id: plan.id } });

  return {
    planId: plan.id,
    planName: plan.name!,
    subscriptionId: subscription.id,
    modules: moduleCount,
    appLabel,
  };
}

async function seedFeatureCatalog() {
  const { FEATURE_CATALOG_SEED } = await import(
    "../src/shared/lib/feature-catalog"
  );
  for (const def of FEATURE_CATALOG_SEED) {
    await prisma.feature.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        status: def.status,
        sort_order: def.sort_order,
      },
      update: {
        name: def.name,
        description: def.description,
        sort_order: def.sort_order,
        deleted_at: null,
      },
    });
  }

  const multi = await prisma.feature.findUnique({
    where: { key: "multi_stock" },
    select: { id: true },
  });
  return multi?.id ?? null;
}

/** EdDeli usa multistock: asegura AppFeature active (crea o actualiza). */
async function seedEddeliMultiStock(appId: number, featureId: number | null) {
  if (!featureId) return;
  await prisma.appFeature.upsert({
    where: {
      app_id_feature_id: { app_id: appId, feature_id: featureId },
    },
    create: { app_id: appId, feature_id: featureId, status: "active" },
    update: { status: "active" },
  });
}

/**
 * Defaults de funciones por app.
 * EdDeli → active (fuerza active si ya existía en planned).
 * Store → planned solo al crear (no pisa overrides existentes).
 */
async function seedDefaultAppFeatures(featureId: number | null) {
  if (!featureId) return [] as string[];

  const defaults: Array<{
    nameMatch: RegExp;
    status: "active" | "planned";
    force?: boolean;
  }> = [
    { nameMatch: /^eddeli$/i, status: "active", force: true },
    { nameMatch: /^store$/i, status: "planned", force: false },
  ];

  const apps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: "deployment" },
    select: { id: true, name: true },
  });

  const log: string[] = [];
  for (const app of apps) {
    const name = app.name || "";
    const def = defaults.find((d) => d.nameMatch.test(name));
    if (!def) continue;

    const existing = await prisma.appFeature.findUnique({
      where: {
        app_id_feature_id: { app_id: app.id, feature_id: featureId },
      },
    });
    if (existing) {
      if (def.force && existing.status !== def.status) {
        await prisma.appFeature.update({
          where: {
            app_id_feature_id: {
              app_id: app.id,
              feature_id: featureId,
            },
          },
          data: { status: def.status },
        });
        log.push(`${name}: multi_stock ${existing.status} → ${def.status}`);
      } else {
        log.push(`${name}: multi_stock=${existing.status}`);
      }
      continue;
    }
    await prisma.appFeature.create({
      data: { app_id: app.id, feature_id: featureId, status: def.status },
    });
    log.push(`${name}: multi_stock=${def.status} (nuevo)`);
  }
  return log;
}

async function main() {
  console.log("Seed %s → BD `%s`", SEED_ENV.platformName, SEED_ENV.databaseName);

  await seedRoles();
  await seedPlatformAccounts();
  const removedRaptor = await removeLegacyRaptorApp();
  const eddeliApp = await seedEdDeliApp();
  const storeApp = await seedStoreApp();
  const sectionCount = await seedProductCatalog(EDDELI_PRODUCT_CATALOG);
  const multiStockFeatureId = await seedFeatureCatalog();
  await seedEddeliMultiStock(eddeliApp.id, multiStockFeatureId);
  const featureAppLog = await seedDefaultAppFeatures(multiStockFeatureId);

  const allModules = await prisma.module.findMany({
    where: { deleted_at: null },
    select: { id: true },
  });
  const moduleIds = allModules.map((m) => m.id);
  await seedAppModules(eddeliApp.id, moduleIds);
  await seedAppModules(storeApp.id, moduleIds);

  const commercialPlans = await seedEdDeliCommercialPlans(eddeliApp.id);
  await seedEdDeliCommercialPlans(storeApp.id);
  const eddeliSub = await seedLocalSubscription(EDDELI_APP_HASH, "EdDeli");
  const storeSub = await seedLocalSubscription(storeApp.hash, "Store");

  const eventTypeRows = await seedEventTypes();

  const lotesSec = await prisma.section.findFirst({
    where: { key: "/inventario/lotes", deleted_at: null },
    select: { status: true, name: true },
  });

  const ventasMod = await prisma.module.findFirst({
    where: { key: "ventas", deleted_at: null },
    select: {
      name: true,
      sections: {
        where: { deleted_at: null },
        select: { key: true, name: true },
        orderBy: { id: "asc" },
      },
    },
  });

  // Empuja entitlement a backends (si están corriendo).
  const { pushEntitlementToApp } =
    await import("../src/shared/lib/push-entitlement");
  const pushEddeli = await pushEntitlementToApp(EDDELI_APP_HASH);
  const pushStore = await pushEntitlementToApp(storeApp.hash);

  console.log(
    "Seed OK [%s]: roles, catálogo global (%d módulos, %d secciones), EdDeli + Store, cuentas%s",
    SEED_ENV.databaseName,
    EDDELI_PRODUCT_CATALOG.length,
    sectionCount,
    removedRaptor ? " · Raptor legacy eliminada" : "",
  );
  if (ventasMod) {
    console.log(
      "  Ventas y Compras: %s → %s",
      ventasMod.name,
      ventasMod.sections.map((s) => s.name).join(" · "),
    );
  }
  console.log(
    "  Planes: %s",
    commercialPlans.map((p) => `${p.name}(${p.modules}m)`).join(", "),
  );
  console.log(
    "  Suscripción EdDeli: %s (%d módulos) → sub %d",
    eddeliSub.planName,
    eddeliSub.modules,
    eddeliSub.subscriptionId,
  );
  console.log(
    "  Suscripción Store: %s (%d módulos) → sub %d · hash %s",
    storeSub.planName,
    storeSub.modules,
    storeSub.subscriptionId,
    storeApp.hash,
  );
  console.log(
    "  EventTypes: %d tipos de evento",
    eventTypeRows.length,
  );
  if (lotesSec) {
    console.log("  Lotes inventario: %s → %s", lotesSec.name, lotesSec.status);
  }
  if (featureAppLog.length) {
    console.log("  Features app: %s", featureAppLog.join(" · "));
  }
  const pushLine = (label: string, push: { skipped?: boolean; ok?: boolean; error?: string; status?: number }) =>
    push.skipped
      ? `${label}: omitido (sin URL)`
      : push.ok
        ? `${label}: OK`
        : `${label}: falló (${push.error || push.status})`;
  console.log(
    "  Entitlement push: %s · %s",
    pushBag("EdDeli", pushEddeli),
    pushBag("Store", pushStore),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
