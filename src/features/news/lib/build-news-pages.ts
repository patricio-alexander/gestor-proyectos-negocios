/** Arma las páginas del periódico (misma lógica que el frontend de las apps). */

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

export type NewsPageModel =
  | {
      id: string;
      heading: string;
      layout: "cover";
      coverVariant: "front" | "grid";
      hero: NewsPageItem | null;
      summaries: NewsPageItem[];
      lead: string;
    }
  | {
      id: string;
      heading: string;
      layout: "feature";
      item: NewsPageItem;
      accentLabel: string;
    }
  | null;

function sortKey(item: NewsPageItem) {
  return Number(item.sortOrder ?? item.sort_order ?? 0);
}

export function buildNewsPages(items: NewsPageItem[]): NewsPageModel[] {
  const map = {
    portada: [] as NewsPageItem[],
    interior: [] as NewsPageItem[],
    breve: [] as NewsPageItem[],
    editorial: [] as NewsPageItem[],
    proximamente: [] as NewsPageItem[],
  };
  for (const item of items) {
    const key = (map as Record<string, NewsPageItem[]>)[item.kind]
      ? (item.kind as keyof typeof map)
      : "interior";
    map[key].push(item);
  }

  const breves = [...map.breve].sort((a, b) => sortKey(a) - sortKey(b));
  const systemCards = breves.filter((b) => sortKey(b) < 20).slice(0, 4);
  const doneCards = breves.filter((b) => sortKey(b) >= 20).slice(0, 4);
  const page1Cards = systemCards.length >= 4 ? systemCards : breves.slice(0, 4);
  const page2Done = doneCards.length >= 4 ? doneCards : breves.slice(4, 8);
  const page2Soon = [...map.proximamente]
    .sort((a, b) => sortKey(a) - sortKey(b))
    .slice(0, 2);
  const page2Cards = [...page2Done.slice(0, 4), ...page2Soon].slice(0, 6);

  const pages: NewsPageModel[] = [];

  pages.push({
    id: "portada-a",
    heading: "Portada",
    layout: "cover",
    coverVariant: "front",
    hero: map.portada[0] || null,
    summaries: page1Cards,
    lead: "En el sistema · lo más útil",
  });

  pages.push({
    id: "portada-b",
    heading: "Portada",
    layout: "cover",
    coverVariant: "grid",
    hero: null,
    summaries: page2Cards,
    lead: "Lo reciente · y lo que se viene",
  });

  const doneForDetail = page2Done.filter((b) => {
    const s = sortKey(b);
    if (s === 20) return false;
    const t = String(b.title || "").toLowerCase();
    if (/secci[oó]n de noticias|noticias del sistema/.test(t) && map.portada[0]) {
      return false;
    }
    return true;
  });

  const featureSequence = [
    ...page1Cards.map((item) => ({
      item,
      heading: "En detalle",
      accentLabel: "En el sistema",
    })),
    ...(map.portada[0]
      ? [
          {
            item: map.portada[0],
            heading: "Primera plana",
            accentLabel: "Lo que se hizo",
          },
        ]
      : []),
    ...doneForDetail.map((item) => ({
      item,
      heading: "En detalle",
      accentLabel: "Lo que se hizo",
    })),
    ...page2Soon.map((item) => ({
      item,
      heading: "Próximamente",
      accentLabel: "Próximamente",
    })),
  ];

  for (const entry of featureSequence) {
    pages.push({
      id: `feature-${entry.item.id}`,
      heading: entry.heading,
      layout: "feature",
      item: entry.item,
      accentLabel: entry.accentLabel,
    });
  }

  if (pages.length % 2 === 1) {
    pages.push(null);
  }
  return pages;
}
