import { gp } from "@/src/shared/ui/theme";

type SectionLimitBadgeProps = {
  limit: number | null;
};

export function SectionLimitBadge({ limit }: SectionLimitBadgeProps) {
  if (limit == null) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: "var(--gp-surface-muted)",
          color: "var(--gp-text-muted)",
        }}
      >
        <span aria-hidden>∞</span>
        Ilimitado
      </span>
    );
  }

  return (
    <span className={gp.badge}>
      {limit.toLocaleString("es-PE")} máx.
    </span>
  );
}

function countSectionsWithLimit(sections: { max_records_limit: number | null }[]) {
  return sections.filter((s) => s.max_records_limit != null).length;
}

export function SectionLimitSummary({
  sections,
}: {
  sections: { max_records_limit: number | null }[];
}) {
  const total = sections.length;
  const limited = countSectionsWithLimit(sections);

  if (total === 0) return null;

  return (
    <span className="text-xs text-[var(--gp-text-muted)]">
      {total} {total === 1 ? "sección" : "secciones"}
      {limited > 0 && (
        <>
          {" · "}
          {limited} con límite
        </>
      )}
    </span>
  );
}
