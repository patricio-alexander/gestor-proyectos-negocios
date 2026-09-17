/** Agrupa noticias para la portada vertical del gestor. */

export type NewsPageItem = {
  id: number;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  kind: string;
  publishedAt?: string | null;
  sortOrder?: number;
  sort_order?: number;
};

export type NewsBoardSectionId =
  | "portada"
  | "novedades"
  | "sistema"
  | "proximamente";

export type NewsBoardSection = {
  id: NewsBoardSectionId;
  eyebrow: string;
  title: string;
  description: string;
  items: NewsPageItem[];
};

export type NewsBoardModel = {
  cover: NewsPageItem | null;
  sections: NewsBoardSection[];
};

function sortKey(item: NewsPageItem) {
  return Number(item.sortOrder ?? item.sort_order ?? 0);
}

function byOrder(a: NewsPageItem, b: NewsPageItem) {
  return sortKey(a) - sortKey(b);
}

/**
 * Orden visual:
 * 1. Portada (kind portada)
 * 2. Novedades — lo nuevo (breves sort ≥ 20)
 * 3. En el sistema — lo que ya funciona (breves sort < 20 + interior/editorial)
 * 4. Próximamente
 */
export function buildNewsBoard(items: NewsPageItem[]): NewsBoardModel {
  const portadas: NewsPageItem[] = [];
  const novedades: NewsPageItem[] = [];
  const sistema: NewsPageItem[] = [];
  const proximamente: NewsPageItem[] = [];

  for (const item of items) {
    const kind = String(item.kind || "");
    if (kind === "portada") {
      portadas.push(item);
      continue;
    }
    if (kind === "proximamente") {
      proximamente.push(item);
      continue;
    }
    if (kind === "breve") {
      if (sortKey(item) >= 20) novedades.push(item);
      else sistema.push(item);
      continue;
    }
    // interior / editorial / desconocidos → lo que ya está en el sistema
    sistema.push(item);
  }

  portadas.sort(byOrder);
  novedades.sort(byOrder);
  sistema.sort(byOrder);
  proximamente.sort(byOrder);

  const cover = portadas[0] || null;

  const sections: NewsBoardSection[] = [
    {
      id: "novedades",
      eyebrow: "Novedades",
      title: "Lo nuevo",
      description: "Cambios recientes y mejoras que acabamos de sumar.",
      items: novedades,
    },
    {
      id: "sistema",
      eyebrow: "En el sistema",
      title: "Ya funciona",
      description: "Lo que tenés disponible y corre bien día a día.",
      items: sistema,
    },
    {
      id: "proximamente",
      eyebrow: "Roadmap",
      title: "Lo que se viene",
      description: "Próximas funciones en preparación.",
      items: proximamente,
    },
  ];

  return { cover, sections };
}
