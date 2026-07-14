type StatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
};

const TONE_STYLES: Record<
  NonNullable<StatusBadgeProps["tone"]>,
  { bg: string; color: string }
> = {
  success: { bg: "rgba(34, 197, 94, 0.15)", color: "#16a34a" },
  warning: { bg: "rgba(234, 179, 8, 0.15)", color: "#ca8a04" },
  danger: { bg: "rgba(239, 68, 68, 0.15)", color: "#dc2626" },
  neutral: { bg: "var(--gp-surface-muted)", color: "var(--gp-text-muted)" },
  info: { bg: "var(--gp-badge-bg)", color: "var(--gp-badge-text)" },
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const styles = TONE_STYLES[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {label}
    </span>
  );
}

export function subscriptionStatusTone(
  status: string,
): NonNullable<StatusBadgeProps["tone"]> {
  if (status === "ACTIVE") return "success";
  if (status === "EXPIRED") return "warning";
  return "danger";
}

export function offerRangeTone(
  status: "active" | "upcoming" | "expired",
): NonNullable<StatusBadgeProps["tone"]> {
  if (status === "active") return "success";
  if (status === "upcoming") return "info";
  return "neutral";
}
