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

describe("FinancialOnboardingFlow accessibility shell", () => {
  it("renders labelled progress, grouped choices and the in-memory session contract", () => {
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
    expect(html).toContain("Estado somente em memória");
    expect(html).toContain("o perfil é compartilhado entre as telas desta sessão");
    expect(html).toContain("Recarregar a aplicação pode descartá-lo");
  });

  it("keeps the primary inputs associated with visible labels", () => {
    const html = renderFlow();

    expect(html).toContain('for="reference-currency"');
    expect(html).toContain("Moeda de referência");
    expect(html).toContain("Tolerância a risco");
    expect(html).toContain("Horizonte financeiro");
  });
});
