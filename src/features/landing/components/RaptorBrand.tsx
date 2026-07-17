import { assetUrl } from "@/src/utils/assetUrl";

const LOGO_ICONS = {
  eye: assetUrl("/eye-logo-raptor-solutions.svg"),
  plain: assetUrl("/logo-raptor-solutions.svg"),
} as const;

const LOGO_WORDMARK_SRC = assetUrl("/raptor-solutions.svg");

type RaptorBrandIcon = keyof typeof LOGO_ICONS;
type RaptorBrandVariant = "hero" | "header" | "footer";

type RaptorBrandProps = {
  variant?: RaptorBrandVariant;
  /** Solo aplica en header/footer. Hero siempre usa plain (sin ojo). */
  icon?: RaptorBrandIcon;
  className?: string;
};

const DEFAULT_ICON: Record<Exclude<RaptorBrandVariant, "hero">, RaptorBrandIcon> = {
  header: "eye",
  footer: "plain",
};

function resolveIcon(variant: RaptorBrandVariant, icon?: RaptorBrandIcon): RaptorBrandIcon {
  if (variant === "hero") {
    return "plain";
  }

  return icon ?? DEFAULT_ICON[variant];
}

export function RaptorBrand({
  variant = "hero",
  icon,
  className = "",
}: RaptorBrandProps) {
  const iconVariant = resolveIcon(variant, icon);

  return (
    <div
      className={`landing-page__brand landing-page__brand--${variant} landing-page__brand--icon-${iconVariant} ${className}`.trim()}
    >
      {
        iconVariant === "eye" && (
          <img
          key={iconVariant}
          src={LOGO_ICONS[iconVariant]}
          alt=""
          aria-hidden
          className="landing-page__brand-icon"
        />)
      }
     
      <img
        src={LOGO_WORDMARK_SRC}
        alt="Raptor Solutions"
        className="landing-page__brand-wordmark"
      />
    </div>
  );
}
