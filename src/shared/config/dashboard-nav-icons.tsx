import type { ComponentType } from "react";
import Bell from "@gravity-ui/icons/Bell";
import LayoutColumns from "@gravity-ui/icons/LayoutColumns";
import Briefcase from "@gravity-ui/icons/Briefcase";
import ClockArrowRotateLeft from "@gravity-ui/icons/ClockArrowRotateLeft";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Database from "@gravity-ui/icons/Database";
import FileText from "@gravity-ui/icons/FileText";
import ChartLine from "@gravity-ui/icons/ChartLine";
import Gift from "@gravity-ui/icons/Gift";
import Passport from "@gravity-ui/icons/Passport";
import Person from "@gravity-ui/icons/Person";
import Persons from "@gravity-ui/icons/Persons";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Smartphone from "@gravity-ui/icons/Smartphone";

type IconProps = { width?: number; height?: number; className?: string };

export const NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  "/dashboard": ChartLine,
  "/dashboard/profile": Person,
  "/dashboard/modules": Cubes3Overlap,
  "/dashboard/notifications": Bell,
  "/dashboard/accounts": Passport,
  "/dashboard/apps": Briefcase,
  "/dashboard/kanban": LayoutColumns,
  "/dashboard/mobile-apps": Smartphone,
  "/dashboard/plans": FileText,
  "/dashboard/offers": Gift,
  "/dashboard/subscriptions": CreditCard,
  "/dashboard/access/users": Persons,
  "/dashboard/access/roles": ShieldKeyhole,
  "/dashboard/events": ClockArrowRotateLeft,
  "/dashboard/backups": Database,
};

export function NavIcon({ href, ...props }: { href: string } & IconProps) {
  const Icon = NAV_ICONS[href] ?? FileText;
  return <Icon {...props} />;
}
