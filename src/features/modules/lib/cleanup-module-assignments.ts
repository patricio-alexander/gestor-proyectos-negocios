import { prisma } from "@/src/shared/lib/prisma";

/**
 * Canal (legacy) duplicaba Canal digital con las mismas rutas.
 * Deja canal_digital, mueve planes/asignaciones y retira canal.
 */
export async function retireLegacyCanalModule() {
  const legacy = await prisma.module.findFirst({
    where: { key: "canal" },
  });
  const digital = await prisma.module.findFirst({
    where: { key: "canal_digital" },
  });
  if (!legacy) return { retired: false, reason: "no canal" };
  if (!digital) return { retired: false, reason: "no canal_digital" };

  const legacyAms = await prisma.appModule.findMany({
    where: { module_id: legacy.id },
  });

  for (const legacyAm of legacyAms) {
    const digitalAm = await prisma.appModule.upsert({
      where: {
        app_id_module_id: {
          app_id: legacyAm.app_id,
          module_id: digital.id,
        },
      },
      update: {},
      create: { app_id: legacyAm.app_id, module_id: digital.id },
    });

    const planLinks = await prisma.planAppModule.findMany({
      where: { app_module_id: legacyAm.id },
    });
    for (const link of planLinks) {
      const already = await prisma.planAppModule.findUnique({
        where: {
          plan_id_app_module_id: {
            plan_id: link.plan_id,
            app_module_id: digitalAm.id,
          },
        },
      });
      if (!already) {
        await prisma.planAppModule.create({
          data: { plan_id: link.plan_id, app_module_id: digitalAm.id },
        });
      }
      await prisma.planAppModule.delete({
        where: {
          plan_id_app_module_id: {
            plan_id: link.plan_id,
            app_module_id: legacyAm.id,
          },
        },
      });
    }

    await prisma.appModule.delete({ where: { id: legacyAm.id } });
  }

  const now = new Date();
  await prisma.section.updateMany({
    where: { module_id: legacy.id, deleted_at: null },
    data: { deleted_at: now },
  });
  if (!legacy.deleted_at) {
    await prisma.module.update({
      where: { id: legacy.id },
      data: { deleted_at: now },
    });
  }

  return { retired: true, movedFrom: legacyAms.length };
}

/**
 * Retira el módulo «Comprobantes electrónicos»: las secciones SRI viven bajo Operación
 * (Comprobantes POS). Mueve planes/apps a operacion y soft-delete el módulo.
 */
export async function retireComprobantesElectronicosModule() {
  const legacy = await prisma.module.findFirst({
    where: { key: "comprobantes_electronicos" },
  });
  const operacion = await prisma.module.findFirst({
    where: { key: "operacion", deleted_at: null },
  });
  if (!legacy) return { retired: false, reason: "no comprobantes_electronicos" };
  if (!operacion) return { retired: false, reason: "no operacion" };

  const now = new Date();
  const stats = {
    retired: true,
    movedSections: 0,
    appsLinked: 0,
  };

  const sections = await prisma.section.findMany({
    where: { module_id: legacy.id },
  });
  for (const sec of sections) {
    if (!sec.key) {
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: sec.deleted_at ?? now },
      });
      continue;
    }
    const target = await prisma.section.findFirst({
      where: { module_id: operacion.id, key: sec.key },
    });
    if (target && target.id !== sec.id) {
      const appSecs = await prisma.appSection.findMany({
        where: { section_id: sec.id },
      });
      for (const as of appSecs) {
        const already = await prisma.appSection.findUnique({
          where: {
            app_id_section_id: { app_id: as.app_id, section_id: target.id },
          },
        });
        if (!already) {
          await prisma.appSection.create({
            data: {
              app_id: as.app_id,
              section_id: target.id,
              status: as.status,
            },
          });
        }
        await prisma.appSection.delete({
          where: {
            app_id_section_id: { app_id: as.app_id, section_id: sec.id },
          },
        });
      }
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: now },
      });
    } else {
      await prisma.section.update({
        where: { id: sec.id },
        data: { module_id: operacion.id, deleted_at: null },
      });
      stats.movedSections += 1;
    }
  }

  const legacyAms = await prisma.appModule.findMany({
    where: { module_id: legacy.id },
  });
  for (const legacyAm of legacyAms) {
    const opAm = await prisma.appModule.upsert({
      where: {
        app_id_module_id: {
          app_id: legacyAm.app_id,
          module_id: operacion.id,
        },
      },
      update: {},
      create: { app_id: legacyAm.app_id, module_id: operacion.id },
    });
    stats.appsLinked += 1;
    const planLinks = await prisma.planAppModule.findMany({
      where: { app_module_id: legacyAm.id },
    });
    for (const link of planLinks) {
      const already = await prisma.planAppModule.findUnique({
        where: {
          plan_id_app_module_id: {
            plan_id: link.plan_id,
            app_module_id: opAm.id,
          },
        },
      });
      if (!already) {
        await prisma.planAppModule.create({
          data: { plan_id: link.plan_id, app_module_id: opAm.id },
        });
      }
      await prisma.planAppModule.delete({
        where: {
          plan_id_app_module_id: {
            plan_id: link.plan_id,
            app_module_id: legacyAm.id,
          },
        },
      });
    }
    await prisma.appModule.delete({ where: { id: legacyAm.id } });
  }

  if (!legacy.deleted_at) {
    await prisma.module.update({
      where: { id: legacy.id },
      data: { deleted_at: now },
    });
  }

  return stats;
}

/**
 * Retira Canal digital: catálogo/grupos → marketing; locales → inventario;
 * productos-destacados se archiva (soft-delete de sección).
 */
export async function retireCanalDigitalModule() {
  const legacy = await prisma.module.findFirst({
    where: { key: "canal_digital" },
  });
  if (!legacy) return { retired: false, reason: "no canal_digital" };

  const marketing = await prisma.module.findFirst({
    where: { key: "marketing", deleted_at: null },
  });
  const inventario = await prisma.module.findFirst({
    where: { key: "inventario", deleted_at: null },
  });
  if (!marketing || !inventario) {
    return { retired: false, reason: "missing marketing or inventario" };
  }

  const now = new Date();
  const stats = {
    retired: true,
    movedSections: 0,
    archivedFeatured: 0,
    appsLinked: 0,
  };

  const targetForKey = (key: string) => {
    if (key === "/canal/locales" || key === "/administracion/sucursales") {
      return inventario;
    }
    if (key === "/canal/productos-destacados") return null; // archive
    return marketing;
  };

  const sections = await prisma.section.findMany({
    where: { module_id: legacy.id },
  });
  for (const sec of sections) {
    const targetMod = targetForKey(sec.key || "");
    if (!targetMod) {
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: sec.deleted_at ?? now },
      });
      stats.archivedFeatured += 1;
      continue;
    }
    if (!sec.key) {
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: sec.deleted_at ?? now },
      });
      continue;
    }
    const target = await prisma.section.findFirst({
      where: { module_id: targetMod.id, key: sec.key },
    });
    if (target && target.id !== sec.id) {
      const appSecs = await prisma.appSection.findMany({
        where: { section_id: sec.id },
      });
      for (const as of appSecs) {
        const already = await prisma.appSection.findUnique({
          where: {
            app_id_section_id: { app_id: as.app_id, section_id: target.id },
          },
        });
        if (!already) {
          await prisma.appSection.create({
            data: {
              app_id: as.app_id,
              section_id: target.id,
              status: as.status,
            },
          });
        }
        await prisma.appSection.delete({
          where: {
            app_id_section_id: { app_id: as.app_id, section_id: sec.id },
          },
        });
      }
      await prisma.section.update({
        where: { id: sec.id },
        data: { deleted_at: now },
      });
    } else {
      await prisma.section.update({
        where: { id: sec.id },
        data: { module_id: targetMod.id, deleted_at: null },
      });
      stats.movedSections += 1;
    }
  }

  const legacyAms = await prisma.appModule.findMany({
    where: { module_id: legacy.id },
  });
  for (const legacyAm of legacyAms) {
    for (const mod of [marketing, inventario]) {
      const am = await prisma.appModule.upsert({
        where: {
          app_id_module_id: {
            app_id: legacyAm.app_id,
            module_id: mod.id,
          },
        },
        update: {},
        create: { app_id: legacyAm.app_id, module_id: mod.id },
      });
      stats.appsLinked += 1;
      const planLinks = await prisma.planAppModule.findMany({
        where: { app_module_id: legacyAm.id },
      });
      for (const link of planLinks) {
        const already = await prisma.planAppModule.findUnique({
          where: {
            plan_id_app_module_id: {
              plan_id: link.plan_id,
              app_module_id: am.id,
            },
          },
        });
        if (!already) {
          await prisma.planAppModule.create({
            data: { plan_id: link.plan_id, app_module_id: am.id },
          });
        }
      }
    }
    await prisma.planAppModule.deleteMany({
      where: { app_module_id: legacyAm.id },
    });
    await prisma.appModule.delete({ where: { id: legacyAm.id } });
  }

  if (!legacy.deleted_at) {
    await prisma.module.update({
      where: { id: legacy.id },
      data: { deleted_at: now },
    });
  }

  return stats;
}

/**
 * Los módulos mobile_* no deben aparecer en apps web (EdDeli/Store/Tienda).
 */
export async function pruneMobileModulesFromWebApps() {
  const webApps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: "deployment" },
    select: { id: true, name: true },
  });
  const mobileModules = await prisma.module.findMany({
    where: { channel: "mobile" },
    select: { id: true },
  });
  const mobileIds = mobileModules.map((m) => m.id);
  if (!webApps.length || !mobileIds.length) {
    return { removed: 0 };
  }

  const rows = await prisma.appModule.findMany({
    where: {
      app_id: { in: webApps.map((a) => a.id) },
      module_id: { in: mobileIds },
    },
    select: { id: true },
  });
  if (!rows.length) return { removed: 0 };

  const amIds = rows.map((r) => r.id);
  await prisma.planAppModule.deleteMany({
    where: { app_module_id: { in: amIds } },
  });
  await prisma.appModule.deleteMany({
    where: { id: { in: amIds } },
  });
  return { removed: amIds.length };
}

/** Quita asignaciones a módulos ya retirados (deleted_at). */
export async function pruneDeletedModulesFromApps() {
  const rows = await prisma.appModule.findMany({
    where: { module: { deleted_at: { not: null } } },
    select: { id: true },
  });
  if (!rows.length) return { removed: 0 };
  const amIds = rows.map((r) => r.id);
  await prisma.planAppModule.deleteMany({
    where: { app_module_id: { in: amIds } },
  });
  await prisma.appModule.deleteMany({ where: { id: { in: amIds } } });
  return { removed: amIds.length };
}

/** Asigna módulos a una app y quita los que no correspondan. */
export async function seedAppModulesExact(appId: number, moduleIds: number[]) {
  const want = new Set(moduleIds);
  const existing = await prisma.appModule.findMany({
    where: { app_id: appId },
    select: { id: true, module_id: true },
  });
  for (const row of existing) {
    if (want.has(row.module_id)) continue;
    await prisma.planAppModule.deleteMany({
      where: { app_module_id: row.id },
    });
    await prisma.appModule.delete({ where: { id: row.id } });
  }
  for (const moduleId of moduleIds) {
    await prisma.appModule.upsert({
      where: { app_id_module_id: { app_id: appId, module_id: moduleId } },
      update: {},
      create: { app_id: appId, module_id: moduleId },
    });
  }
}

/**
 * Une Publicidad + Diseño promocional en Marketing y mueve planes/apps.
 * Las secciones (campañas, editor, etc.) pasan al módulo padre.
 */
export async function mergeMarketingModule() {
  const now = new Date();
  const marketing = await prisma.module.upsert({
    where: { key: "marketing" },
    update: {
      name: "Marketing",
      description:
        "Promociones por grupo de clientes, señalización en pantallas y editor de piezas.",
      deleted_at: null,
      channel: "web",
      is_maintainer: false,
    },
    create: {
      key: "marketing",
      name: "Marketing",
      description:
        "Promociones por grupo de clientes, señalización en pantallas y editor de piezas.",
      channel: "web",
      status: "active",
    },
  });

  const stats = {
    merged: true,
    marketingId: marketing.id,
    movedSections: 0,
    retiredModules: 0,
    appsLinked: 0,
  };

  for (const key of ["publicidad", "diseno_promocional"] as const) {
    const legacy = await prisma.module.findFirst({ where: { key } });
    if (!legacy || legacy.id === marketing.id) continue;

    const sections = await prisma.section.findMany({
      where: { module_id: legacy.id },
    });
    for (const sec of sections) {
      if (!sec.key) {
        await prisma.section.update({
          where: { id: sec.id },
          data: { module_id: marketing.id, deleted_at: sec.deleted_at ?? now },
        });
        stats.movedSections += 1;
        continue;
      }
      const target = await prisma.section.findFirst({
        where: { module_id: marketing.id, key: sec.key },
      });
      if (target && target.id !== sec.id) {
        const appSecs = await prisma.appSection.findMany({
          where: { section_id: sec.id },
        });
        for (const as of appSecs) {
          const already = await prisma.appSection.findUnique({
            where: {
              app_id_section_id: { app_id: as.app_id, section_id: target.id },
            },
          });
          if (!already) {
            await prisma.appSection.create({
              data: {
                app_id: as.app_id,
                section_id: target.id,
                status: as.status,
              },
            });
          }
          await prisma.appSection.delete({
            where: {
              app_id_section_id: { app_id: as.app_id, section_id: sec.id },
            },
          });
        }
        await prisma.section.update({
          where: { id: sec.id },
          data: { deleted_at: now },
        });
      } else {
        await prisma.section.update({
          where: { id: sec.id },
          data: { module_id: marketing.id, deleted_at: null },
        });
        stats.movedSections += 1;
      }
    }

    const legacyAms = await prisma.appModule.findMany({
      where: { module_id: legacy.id },
    });
    for (const legacyAm of legacyAms) {
      const marketingAm = await prisma.appModule.upsert({
        where: {
          app_id_module_id: {
            app_id: legacyAm.app_id,
            module_id: marketing.id,
          },
        },
        update: {},
        create: { app_id: legacyAm.app_id, module_id: marketing.id },
      });
      stats.appsLinked += 1;
      const planLinks = await prisma.planAppModule.findMany({
        where: { app_module_id: legacyAm.id },
      });
      for (const link of planLinks) {
        const already = await prisma.planAppModule.findUnique({
          where: {
            plan_id_app_module_id: {
              plan_id: link.plan_id,
              app_module_id: marketingAm.id,
            },
          },
        });
        if (!already) {
          await prisma.planAppModule.create({
            data: { plan_id: link.plan_id, app_module_id: marketingAm.id },
          });
        }
        await prisma.planAppModule.delete({
          where: {
            plan_id_app_module_id: {
              plan_id: link.plan_id,
              app_module_id: legacyAm.id,
            },
          },
        });
      }
      await prisma.appModule.delete({ where: { id: legacyAm.id } });
    }

    const offers = await prisma.offerModule.findMany({
      where: { module_id: legacy.id },
    });
    for (const om of offers) {
      const already = await prisma.offerModule.findUnique({
        where: {
          offer_id_module_id: {
            offer_id: om.offer_id,
            module_id: marketing.id,
          },
        },
      });
      if (!already) {
        await prisma.offerModule.create({
          data: { offer_id: om.offer_id, module_id: marketing.id },
        });
      }
      await prisma.offerModule.delete({
        where: {
          offer_id_module_id: {
            offer_id: om.offer_id,
            module_id: legacy.id,
          },
        },
      });
    }

    if (!legacy.deleted_at) {
      await prisma.module.update({
        where: { id: legacy.id },
        data: { deleted_at: now },
      });
      stats.retiredModules += 1;
    }
  }

  const webApps = await prisma.apps.findMany({
    where: { deleted_at: null, kind: "deployment" },
    select: { id: true },
  });
  for (const app of webApps) {
    await prisma.appModule.upsert({
      where: {
        app_id_module_id: { app_id: app.id, module_id: marketing.id },
      },
      update: {},
      create: { app_id: app.id, module_id: marketing.id },
    });
  }

  return stats;
}

