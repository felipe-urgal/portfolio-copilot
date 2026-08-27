import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { FinancialOnboardingFlow } from "@/features/onboarding/financial-onboarding-flow";
import { requireAuthenticatedIdentity } from "@/lib/identity-server";

export const metadata: Metadata = {
  title: `Onboarding financeiro | ${APP_NAME}`,
  description:
    "Defina seu perfil financeiro, reserva e objetivos para revisar um snapshot validado.",
};

export default async function OnboardingPage() {
  await requireAuthenticatedIdentity();

  return <FinancialOnboardingFlow />;
}
