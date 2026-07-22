"use client";

import { Dropdown } from "@heroui/react";
import Moon from "@gravity-ui/icons/Moon";
import Sun from "@gravity-ui/icons/Sun";
import StarFill from "@gravity-ui/icons/StarFill";
import LayoutColumns from "@gravity-ui/icons/LayoutColumns";
import Check from "@gravity-ui/icons/Check";
import { useThemeMode, type ThemeMode } from "@/src/shared/providers/ThemeProvider";
import { gp } from "@/src/shared/ui/theme";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "neo", label: "Neon", Icon: StarFill },
  { value: "system", label: "Sistema", Icon: LayoutColumns },
];

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "dark") {
    return <Moon width={18} height={18} style={{ color: "var(--gp-primary)" }} />;
  }
  if (mode === "neo") {
    return (
      <StarFill width={18} height={18} style={{ color: "var(--gp-accent-cyan)" }} />
    );
  }
  if (mode === "system") {
    return (
      <LayoutColumns width={18} height={18} style={{ color: "var(--gp-primary)" }} />
    );
  }
  return <Sun width={18} height={18} style={{ color: "var(--gp-primary)" }} />;
}

export function ThemeSwitcher() {
  const { mode, setMode } = useThemeMode();

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="Cambiar tema" className={gp.iconTrigger}>
        <ThemeIcon mode={mode} />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="min-w-44">
        <Dropdown.Menu
          aria-label="Tema"
          onAction={(key) => setMode(String(key) as ThemeMode)}
        >
          {OPTIONS.map(({ value, label, Icon }) => (
            <Dropdown.Item key={value} id={value} textValue={label}>
              <span className="flex w-full items-center gap-2">
                <Icon width={16} height={16} />
                <span className="flex-1">{label}</span>
                {mode === value ? (
                  <Check width={14} height={14} style={{ color: "var(--gp-accent-cyan)" }} />
                ) : null}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
