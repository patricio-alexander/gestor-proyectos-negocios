/**
 * Seed catálogo móvil Panadería TV (channel=mobile).
 * Módulo: Pantalla — secciones del kiosco / signage.
 *
 *   npx tsx scripts/seed-panaderiatv-mobile-catalog.ts
 *
 * Opcional: PANADERIATV_API_KEY=ma_... (si la app aún no existe, se crea con esa key)
 */
import { prisma } from "../src/shared/lib/prisma";
import { ensureMobileControlApp } from "../src/features/mobile-apps/lib/mobile-control-app";
import { randomBytes } from "crypto";

const APP_KEY = "panaderiatv";
const APP_NAME = "Panadería TV";
const APP_DESCRIPTION =
  "Display / signage Android TV — campañas EdDeli a pantalla completa + OTA del gestor.";

/** Módulo único de la app TV */
const MOBILE_MODULES = [
  {
    key: "mobile_pantalla",
    name: "Pantalla",
    description:
      "Reproductor TV, configuración del dispositivo, conexión, modo offline y actualizaciones OTA.",
    status: "active" as const,
    sections: [
      {
        key: "/pantalla/reproductor",
        name: "Reproductor",
        status: "active" as const,
      },
      {
        key: "/pantalla/configuracion",
        name: "Configuración",
        status: "active" as const,
      },
      {
        key: "/pantalla/conexion",
        name: "Conexión",
        status: "active" as const,
      },
      {
        key: "/pantalla/offline",
        name: "Modo offline",
        status: "active" as const,
      },
      {
        key: "/pantalla/actualizaciones",
        name: "Actualizaciones",
        status: "active" as const,
      },
      {
        key: "/pantalla/campanas",
        name: "Campañas",
        status: "planned" as const,
      },
    ],
  },
] as const;

async function ensureMobileApp() {
  let app = await prisma.mobileApp.findFirst({
    where: { key: APP_KEY, deleted_at: null },
  });

  const envKey = String(process.env.PANADERIATV_API_KEY || "").trim();

  if (!app) {
    // También buscar por API key (app creada en panel con otra key temporal)
    if (envKey) {
      app = await prisma.mobileApp.findFirst({
        where: { api_key: envKey, deleted_at: null },
      });
    }
  }

  if (!app) {
    const api_key = envKey || `ma_${randomBytes(16).toString("hex")}`;
    app = await prisma.mobileApp.create({
      data: {
        key: APP_KEY,
        name: APP_NAME,
        description: APP_DESCRIPTION,
        api_key,
      },
    });
    console.log(`  + MobileApp ${APP_KEY} (#${app.id})`);
  } else {
    app = await prisma.mobileApp.update({
      where: { id: app.id },
      data: {
        key: APP_KEY,
        name: APP_NAME,
        description: APP_DESCRIPTION,
        deleted_at: null,
        ...(envKey ? { api_key: envKey } : {}),
      },
    });
    console.log(`  ~ MobileApp ${APP_KEY} (#${app.id})`);
  }

  const controlAppId = await ensureMobileControlApp({
    id: app.id,
    key: app.key,
    name: app.name,
    app_id: app.app_id,
  });
  console.log(`  = Control Apps#${controlAppId}`);

  return { app, controlAppId };
}

async function ensureModule(def: (typeof MOBILE_MODULES)[number]) {
  // Preferir key; si el usuario creó "Pantalla" a mano, reutilizar por nombre
  let mod = await prisma.module.findFirst({
    where: { key: def.key },
  });

  if (!mod) {
    mod = await prisma.module.findFirst({
      where: {
        channel: "mobile",
        deleted_at: null,
        name: { equals: def.name },
      },
    });
    if (mod && mod.key !== def.key) {
      mod = await prisma.module.update({
        where: { id: mod.id },
        data: { key: def.key },
      });
      console.log(`  ~ Module renombrado key → ${def.key} (#${mod.id})`);
    }
  }

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
        key: def.key,
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
      console.log(`    + sección ${s.key}`);
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
  if (existing) {
    if (existing.status !== "active") {
      return prisma.appModule.update({
        where: { id: existing.id },
        data: { status: "active" },
      });
    }
    return existing;
  }
  return prisma.appModule.create({
    data: { app_id: appId, module_id: moduleId, status: "active" },
  });
}

async function main() {
  console.log("Panadería TV — app + módulo Pantalla…");
  const { app, controlAppId } = await ensureMobileApp();

  console.log("Módulos / secciones…");
  for (const def of MOBILE_MODULES) {
    const mod = await ensureModule(def);
    await ensureAppModule(controlAppId, mod.id);
    console.log(`  = Asignado a Apps#${controlAppId}`);
  }

  console.log("Listo.");
  console.log(`  app_key=${app.key}`);
  console.log(`  api_key=${app.api_key}`);
  console.log(`  control_app_id=${controlAppId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
