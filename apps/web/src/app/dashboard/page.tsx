import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_NAME}`,
  description:
    "Visão geral do MVP com estados vazios explícitos e sem métricas financeiras fictícias.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
