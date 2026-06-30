import type { ComponentType, ReactNode } from "react";
import { gp } from "@/src/shared/ui/theme";

type PageHeaderProps = {
  title: string;
  description?: string;
  Icon?: ComponentType<{ width?: number; height?: number; className?: string }>;
  action?: ReactNode;
};

export function PageHeader({ title, description, Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          {Icon && <Icon width={24} height={24} className="gp-icon-box-text" />}
          <h1 className={gp.title}>{title}</h1>
        </div>
        {description && <p className={gp.subtitle}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
