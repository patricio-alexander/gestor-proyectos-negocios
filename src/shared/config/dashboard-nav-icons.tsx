import type { ComponentType } from "react";
import Bell from "@gravity-ui/icons/Bell";
import Briefcase from "@gravity-ui/icons/Briefcase";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import FileText from "@gravity-ui/icons/FileText";
import House from "@gravity-ui/icons/House";
import Key from "@gravity-ui/icons/Key";
import Person from "@gravity-ui/icons/Person";
import Persons from "@gravity-ui/icons/Persons";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Passport from "@gravity-ui/icons/Passport";

type IconProps = { width?: number; height?: number; className?: string };

export const NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  "/dashboard": House,
  "/dashboard/profile": Person,
  "/dashboard/modules": Cubes3Overlap,
  "/dashboard/notifications": Bell,
  "/dashboard/accounts": Passport,
  "/dashboard/apps": Briefcase,
  "/dashboard/plans": FileText,
  "/dashboard/subscriptions": CreditCard,
  "/dashboard/licenses": ShieldKeyhole,
  "/dashboard/api-keys": Key,
  "/dashboard/access/users": Persons,
  "/dashboard/access/roles": ShieldKeyhole,
};

export function NavIcon({ href, ...props }: { href: string } & IconProps) {
  const Icon = NAV_ICONS[href] ?? FileText;
  return <Icon {...props} />;
}
