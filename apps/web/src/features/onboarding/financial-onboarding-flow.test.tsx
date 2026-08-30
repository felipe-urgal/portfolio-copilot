import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialSessionProvider } from "@/components/financial-session";

import { FinancialOnboardingFlow } from "./financial-onboarding-flow";

const FLOW_SOURCE = readFileSync(new URL("./financial-onboarding-flow.tsx", import.meta.url), "utf8");
const FLOW_CSS = readFileSync(
  new URL("./financial-onboarding-flow.module.css", import.meta.url),
  "utf8",
);

function renderFlow(): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider>
      <FinancialOnboardingFlow />
    </FinancialSessionProvider>,
  );
}

describe("FinancialOnboardingFlow", () => {
  it("renders a guided four-step flow subordinate to the AppShell", () => {
    const html = renderFlow();

    expect(html).toContain("Perfil financeiro");
    expect(html).toContain('aria-label="Progresso do onboarding"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Etapa 1 de 4");
    expect(html).toContain("Perfil");
    expect(html).toContain("Reserva");
    expect(html).toContain("Objetivos");
    expect(html).toContain("Revisão");
    expect(html).not.toContain("<main");
    expect(html).not.toContain('aria-label="Navegação principal"');
  });

  it("keeps profile inputs grouped, labelled and described", () => {
    const html = renderFlow();

    expect(html).toContain("<fieldset");
    expect(html).toContain('name="riskTolerance"');
    expect(html).toContain('name="horizon"');
    expect(html).toContain('aria-describedby="risk-help"');
    expect(html).toContain('aria-describedby="horizon-help"');
    expect(html).toContain('id="risk-help"');
    expect(html).toContain('id="horizon-help"');
    expect(html).toContain('id="reference-currency"');
    expect(html).toContain('for="reference-currency"');
    expect(html).toContain("Moeda de referência");
    expect(html).toContain("Tolerância a risco");
    expect(html).toContain("Horizonte financeiro");
  });

  it("moves persistence detail to progressive disclosure without changing its opt-in contract", () => {
    const html = renderFlow();

    expect(html).toContain("<details");
    expect(html).toContain("Como este perfil é salvo?");
    expect(html).toContain("Por padrão, o perfil fica somente nesta sessão");
    expect(html).toContain("você decide se quer salvá-lo");
    expect(html).toContain("Nada é sincronizado automaticamente");
    expect(html).not.toContain("<details open");
  });

  it("uses R2 primitives instead of local form, choice, feedback and button implementations", () => {
    expect(FLOW_SOURCE).toContain("ChoiceCard");
    expect(FLOW_SOURCE).toContain("SegmentedControl");
    expect(FLOW_SOURCE).toContain("TextInput");
    expect(FLOW_SOURCE).toContain("Select");
    expect(FLOW_SOURCE).toContain("FieldError");
    expect(FLOW_SOURCE).toContain("EmptyState");
    expect(FLOW_SOURCE).toContain("PageHeader");
    expect(FLOW_SOURCE).toContain("Surface");
    expect(FLOW_SOURCE).toContain("LinkButton");
    expect(FLOW_CSS).not.toContain(".primaryButton");
    expect(FLOW_CSS).not.toContain(".secondaryButton");
    expect(FLOW_CSS).not.toContain(".textInput");
    expect(FLOW_CSS).not.toContain(".selectInput");
    expect(FLOW_CSS).not.toContain(".choiceSelected");
    expect(FLOW_CSS).not.toContain(".switchLabel");
  });

  it("keeps feature styling on semantic tokens without a parallel palette", () => {
    expect(FLOW_CSS).toContain("var(--color-text-primary)");
    expect(FLOW_CSS).toContain("var(--color-border-subtle)");
    expect(FLOW_CSS).toContain("var(--focus-ring-width)");
    expect(FLOW_CSS).toContain("var(--touch-target-min)");
    expect(FLOW_CSS).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(FLOW_CSS).not.toMatch(/rgba?\(/i);
  });

  it("keeps the explicit exit back to the dashboard", () => {
    const html = renderFlow();

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Voltar ao dashboard");
  });
});
