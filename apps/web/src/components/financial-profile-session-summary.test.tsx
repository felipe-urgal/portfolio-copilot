import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialProfileSessionSummary } from "./financial-profile-session-summary";
import { FinancialSessionProvider } from "./financial-session";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "3000000" },
  goals: [
    {
      id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
      type: "NET_WORTH",
      targetAmount: { currency: "BRL", minorUnits: "100000000" },
      targetDate: null,
    },
    {
      id: "7744df4d-bb41-4a07-b582-a8d8f710a8af",
      type: "DATED_PURPOSE",
      targetAmount: { currency: "BRL", minorUnits: "5000000" },
      targetDate: "2030-12-31",
    },
  ],
};

function renderSummary(initialFinancialProfile: FinancialProfileSnapshot | null): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider initialFinancialProfile={initialFinancialProfile}>
      <FinancialProfileSessionSummary />
    </FinancialSessionProvider>,
  );
}

describe("FinancialProfileSessionSummary", () => {
  it("renders an honest absent state without fabricating financial context", () => {
    const html = renderSummary(null);

    expect(html).toContain('aria-label="Perfil financeiro da sessão"');
    expect(html).toContain("Não configurado");
    expect(html).toContain("Nenhum contexto financeiro validado foi compartilhado nesta sessão.");
    expect(html).toContain('href="/onboarding"');
    expect(html).not.toMatch(/BRL\s+\d/);
    expect(html).not.toMatch(/>\s*0%\s*</);
  });

  it("renders profile, reserve target and goals from the shared snapshot without exposing ids", () => {
    const html = renderSummary(PROFILE);

    expect(html).toContain("Disponível na sessão");
    expect(html).toContain("BRL");
    expect(html).toContain("Média");
    expect(html).toContain("Longo prazo");
    expect(html).toContain("BRL 30000,00");
    expect(html).toContain("Patrimônio");
    expect(html).toContain("BRL 1000000,00");
    expect(html).toContain("Objetivo com data");
    expect(html).toContain("Até 31/12/2030");
    expect(html).toContain("Meta desejada declarada; não representa saldo atual");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain(PROFILE.goals[0]?.id ?? "missing-goal-id");
  });

  it("distinguishes missing reserve and goals from zero or progress", () => {
    const html = renderSummary({ ...PROFILE, emergencyReserveTarget: null, goals: [] });

    expect(html).toContain("Não definida");
    expect(html).toContain("Nenhum objetivo registrado no perfil desta sessão.");
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });
});
