import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialSessionProvider } from "@/components/financial-session";

import { FinancialOnboardingFlow } from "./financial-onboarding-flow";

function renderFlow(): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider>
      <FinancialOnboardingFlow />
    </FinancialSessionProvider>,
  );
}

describe("FinancialOnboardingFlow accessibility", () => {
  it("renders labelled progress, grouped choices and the opt-in persistence contract", () => {
    const html = renderFlow();

    expect(html).toContain('aria-label="Progresso do onboarding"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("<fieldset");
    expect(html).toContain('name="riskTolerance"');
    expect(html).toContain('name="horizon"');
    expect(html).toContain('aria-describedby="risk-help"');
    expect(html).toContain('aria-describedby="horizon-help"');
    expect(html).toContain('id="risk-help"');
    expect(html).toContain('id="horizon-help"');
    expect(html).toContain('id="reference-currency"');
    expect(html).toContain("Persistência sob seu controle");
    expect(html).toContain("Por padrão, o perfil fica só nesta sessão");
    expect(html).toContain("você decide se quer salvá-lo neste dispositivo");
  });

  it("keeps the primary inputs associated with visible labels", () => {
    const html = renderFlow();

    expect(html).toContain('for="reference-currency"');
    expect(html).toContain("Moeda de referência");
    expect(html).toContain("Tolerância a risco");
    expect(html).toContain("Horizonte financeiro");
  });

  it("does not recreate protected-app landmarks or global navigation chrome", () => {
    const html = renderFlow();

    expect(html).not.toContain("<main");
    expect(html).not.toContain("<header");
    expect(html).not.toContain('aria-label="Navegação principal"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Voltar ao dashboard");
  });
});
