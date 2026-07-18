"use client";

import { DashboardShell } from "@/src/shared/components/DashboardShell";
import { RealtimeProvider } from "@/src/shared/providers/RealtimeProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeProvider>
      <DashboardShell>{children}</DashboardShell>
    </RealtimeProvider>
  );
}
