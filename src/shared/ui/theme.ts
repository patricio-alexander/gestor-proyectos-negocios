/** Clases de tema reutilizables — usar en lugar de zinc-* hardcodeado. */
export const gp = {
  page: "gp-page",
  pageGap8: "gp-page-gap-8",
  title: "gp-title",
  titleLg: "gp-title-lg",
  subtitle: "gp-subtitle mt-1",
  subtitleBlock: "gp-subtitle mt-2 max-w-xl",
  card: "gp-card",
  cardPadded: "gp-card px-5 py-4",
  cardInteractive: "gp-card gp-card-interactive flex h-full items-center gap-4 px-5 py-4",
  iconBox: "gp-icon-box h-10 w-10 shrink-0",
  iconBoxSm: "gp-icon-box h-9 w-9 shrink-0",
  iconTitle: "gp-icon-box-text",
  label: "gp-label flex flex-col gap-1.5",
  badge: "gp-badge",
  empty: "gp-empty px-5 py-8 text-center text-sm",
  input: "gp-input",
  select: "gp-select",
  textarea: "gp-textarea",
  tableWrap: "gp-table-wrap",
  table: "gp-table",
  navItem: "gp-nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
  navItemActive: "gp-nav-item gp-nav-item-active flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
  navItemCollapsed: "gp-nav-item-collapsed justify-center px-2",
  navGroup: "gp-nav-group-title mb-2 px-3 text-xs font-semibold uppercase tracking-wide",
  topbar: "gp-topbar fixed top-0 z-50 flex h-14 items-center gap-4 px-4 transition-[left,width] duration-200 ease-in-out",
  sidebar: "gp-sidebar fixed bottom-0 left-0 top-0 z-40 flex flex-col transition-[width] duration-200 ease-in-out",
  sidebarOpen: "gp-sidebar-open",
  sidebarClosed: "gp-sidebar-closed",
  sidebarHeader: "gp-sidebar-header flex h-14 shrink-0 items-center gap-2 border-b px-3",
  sidebarBrand: "gp-sidebar-brand flex min-w-0 flex-1 items-center gap-2.5",
  main: "gp-main",
  iconTrigger: "gp-icon-trigger",
  avatarTrigger: "gp-avatar-trigger",
} as const;

/** @deprecated usar gp.input */
export const INPUT_CLASS = gp.input;
/** @deprecated usar gp.select */
export const SELECT_CLASS = gp.select;
