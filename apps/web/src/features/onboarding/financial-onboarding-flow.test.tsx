import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialOnboardingFlow } from "./financial-onboarding-flow";

describe("FinancialOnboardingFlow accessibility shell", () => {
  it("renders labelled progress, grouped choices and an explicitly local-state notice", () => {
    const html = renderToStaticMarkup(<FinancialOnboardingFlow />);

    expect(html).toContain('aria-label="Progresso do onboarding"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("<fieldset");
    expect(html).toContain('name="riskTolerance"');
    expect(html).toContain('name="horizon"');
    expect(html).toContain('id="reference-currency"');
    expect(html).toContain("Sem salvamento automático");
    expect(html).toContain("Os dados vivem somente nesta página durante este MVP.");
  });

  it("keeps the primary inputs associated with visible labels", () => {
    const html = renderToStaticMarkup(<FinancialOnboardingFlow />);

    expect(html).toContain('for="reference-currency"');
    expect(html).toContain("Moeda de referência");
    expect(html).toContain("Tolerância a risco");
    expect(html).toContain("Horizonte financeiro");
  });
});
