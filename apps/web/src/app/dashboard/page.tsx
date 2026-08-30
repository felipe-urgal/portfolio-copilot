import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { requireAuthenticatedIdentity } from "@/lib/identity-server";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_NAME}`,
  description:
    "Workspace financeiro com contexto real, próximos passos explícitos e nenhuma métrica inventada.",
};

export default async function DashboardPage() {
  const identity = await requireAuthenticatedIdentity();

  return (
    <AppShell activeRoute="/dashboard" identity={identity}>
      <DashboardOverview displayName={identity.displayName} />
    </AppShell>
  );
}
