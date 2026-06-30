"use client";

import type { ComponentType } from "react";
import Magnifier from "@gravity-ui/icons/Magnifier";
import { gp } from "@/src/shared/ui/theme";

type TableSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  total: number;
  totalLabel?: string;
};

export function TableSearchBar({
  value,
  onChange,
  placeholder = "Buscar…",
  total,
  totalLabel = "registros",
}: TableSearchBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="gp-search-wrap">
        <Magnifier width={16} height={16} className="gp-search-icon" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${gp.input} gp-search-input`}
        />
      </div>
      <p className={`${gp.subtitle} shrink-0 text-sm`}>
        {total} {totalLabel}
      </p>
    </div>
  );
}

export type ManagerHeaderProps = {
  title: string;
  description?: string;
  Icon?: ComponentType<{ width?: number; height?: number; className?: string }>;
  action?: React.ReactNode;
};

export function ManagerHeader({ title, description, Icon, action }: ManagerHeaderProps) {
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
