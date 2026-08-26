import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { FinancialOnboardingFlow } from "@/features/onboarding/financial-onboarding-flow";

export const metadata: Metadata = {
  title: `Onboarding financeiro | ${APP_NAME}`,
  description:
    "Defina seu perfil financeiro, reserva e objetivos para revisar um snapshot validado.",
};

export default function OnboardingPage() {
  return <FinancialOnboardingFlow />;
}
