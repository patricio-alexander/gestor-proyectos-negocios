export const queryKeys = {
  kanban: {
    all: ["kanban"] as const,
    board: ["kanban", "board"] as const,
  },
  apps: {
    all: ["apps"] as const,
    list: ["apps", "list"] as const,
    detail: (id: number) => ["apps", "detail", id] as const,
  },
  modules: {
    all: ["modules"] as const,
    list: ["modules", "list"] as const,
  },
  users: {
    all: ["users"] as const,
    list: ["users", "list"] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: ["roles", "list"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    overview: ["dashboard", "overview"] as const,
  },
  events: {
    all: ["events"] as const,
    list: (appId?: number, range?: string) =>
      ["events", "list", { appId: appId ?? null, range: range ?? null }] as const,
    stats: (range?: string) => ["events", "stats", { range: range ?? null }] as const,
  },
  eventTypes: {
    all: ["event-types"] as const,
    list: ["event-types", "list"] as const,
  },
} as const;
