import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinancialSessionProvider } from "@/components/financial-session";

import { FinancialOnboardingFlow } from "./financial-onboarding-flow";

const FLOW_SOURCE = readFileSync(
  new URL("./financial-onboarding-flow.tsx", import.meta.url),
  "utf8",
);
const FLOW_CSS = readFileSync(
  new URL("./financial-onboarding-flow.module.css", import.meta.url),
  "utf8",
);
const FEEDBACK_SOURCE = readFileSync(
  new URL("../../components/ui/feedback.tsx", import.meta.url),
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
    expect(FLOW_SOURCE).not.toContain("aria-invalid={riskError !== undefined}");
    expect(FLOW_SOURCE).not.toContain("aria-invalid={horizonError !== undefined}");
    expect(FLOW_SOURCE).toContain(
      'data-invalid={index === 0 && riskError !== undefined ? "true" : undefined}',
    );
    expect(FLOW_SOURCE).toContain(
      'data-invalid={index === 0 && horizonError !== undefined ? "true" : undefined}',
    );
  });

  it("announces domain-required decisions before validation errors without replacing domain validation", () => {
    const html = renderFlow();

    expect(html).toMatch(/id="reference-currency"[^>]*required=""/);
    expect(html).toMatch(/type="radio"[^>]*required=""[^>]*name="riskTolerance"/);
    expect(html).toMatch(/type="radio"[^>]*required=""[^>]*name="horizon"/);
    expect(html).toContain("Tolerância a risco (obrigatório)");
    expect(html).toContain("Horizonte financeiro (obrigatório)");
    expect(FLOW_SOURCE).toContain('<Label htmlFor="reserve-target" required>');
    expect(FLOW_SOURCE).toMatch(/name="reserveTarget"\s+required/);
    expect(FLOW_SOURCE).toContain("<Label htmlFor={`${goal.clientId}-type`} required>");
    expect(FLOW_SOURCE).toMatch(/id=\{`\$\{goal\.clientId\}-type`\}\s+required/);
    expect(FLOW_SOURCE).toContain("<Label htmlFor={`${goal.clientId}-amount`} required>");
    expect(FLOW_SOURCE).toMatch(/id=\{`\$\{goal\.clientId\}-amount`\}\s+required/);
    expect(FLOW_SOURCE).toContain("required={dateRequiredByDomain}");
    expect(FLOW_SOURCE).not.toContain("aria-required={dateRequiredByDomain}");
    expect(FLOW_SOURCE).toContain(
      "<form className={styles.form} noValidate onSubmit={handleSubmit}>",
    );
    expect(FLOW_SOURCE).toContain(
      "validateOnboardingStep(state.step, state.draft, createBrowserId)",
    );
  });

  it("keeps the goals empty state within the active onboarding step heading", () => {
    expect(FLOW_SOURCE).toContain(
      '<h2 id="onboarding-step-title" ref={stepHeadingRef} tabIndex={-1}>',
    );
    expect(FLOW_SOURCE).toMatch(/<EmptyState\s+title="Nenhum objetivo adicionado"/);
    expect(FLOW_SOURCE).not.toMatch(
      /<EmptyState\s+headingLevel=\{2\}\s+title="Nenhum objetivo adicionado"/,
    );
    expect(FEEDBACK_SOURCE).toContain('headingLevel === 4 ? "h4" : "p"');
  });

  it("moves focus to the step heading only when the active step changes", () => {
    const html = renderFlow();

    expect(html).toContain('tabindex="-1"');
    expect(FLOW_SOURCE).toContain("previousStepRef.current === state.step");
    expect(FLOW_SOURCE).toContain("stepHeadingRef.current?.focus()");
    expect(FLOW_SOURCE).toContain("ref={stepHeadingRef}");
    expect(FLOW_SOURCE).toContain("tabIndex={-1}");
  });

  it("preserves focus when goals are added or removed", () => {
    expect(FLOW_SOURCE).toContain("pendingGoalFocusRef.current = clientId;");
    expect(FLOW_SOURCE).toContain("goalHeadingRefs.current[target]?.focus()");
    expect(FLOW_SOURCE).toContain("addGoalButtonRef.current?.focus()");
    expect(FLOW_SOURCE).toContain('draft.goals[index - 1]?.clientId ?? "add-button"');
    expect(FLOW_SOURCE).toContain("ref={headingRef} tabIndex={-1}");
    expect(FLOW_SOURCE).toContain("onRemove={() => removeGoal(goal.clientId, index)}");
    expect(FLOW_SOURCE).toContain("ref={addGoalButtonRef}");
  });

  it("keeps persistence detail in the canonical progressive disclosure without changing opt-in", () => {
    const html = renderFlow();

    expect(html).toContain("<details");
    expect(html).toContain("Como este perfil é salvo?");
    expect(html).toContain("Por padrão, o perfil fica somente nesta sessão");
    expect(html).toContain("você decide se quer salvá-lo");
    expect(html).toContain("Nada é sincronizado automaticamente");
    expect(html).not.toContain("<details open");
    expect(FLOW_SOURCE).toContain("<Disclosure");
    expect(FLOW_SOURCE).not.toContain("<details className={styles.persistenceDisclosure}");
    expect(FLOW_CSS).not.toContain(".persistenceDisclosure summary");
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
    expect(FLOW_SOURCE).toContain("Disclosure");
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
