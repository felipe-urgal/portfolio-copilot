import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialSessionProvider } from "@/components/financial-session";

import { DashboardOverview } from "./dashboard-overview";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "1500000" },
  goals: [
    {
      id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
      type: "RETIREMENT",
      targetAmount: { currency: "BRL", minorUnits: "200000000" },
      targetDate: null,
    },
  ],
};

function renderDashboard(initialFinancialProfile: FinancialProfileSnapshot | null = null): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider initialFinancialProfile={initialFinancialProfile}>
      <DashboardOverview />
    </FinancialSessionProvider>,
  );
}

describe("DashboardOverview honest states", () => {
  it("renders product navigation and keeps unavailable financial metrics explicit", () => {
    const html = renderDashboard();

    expect(html).toContain('aria-label="Navegação principal"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain('href="/health"');
    expect(html).toContain("Patrimônio total");
    expect(html).toContain("Dado indisponível");
    expect(html).toContain("Aporte do mês");
    expect(html).toContain("Ainda não calculado");
    expect(html).toContain("Carteira não disponível no dashboard");
    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });

  it("shows the honest profile-absent session state", () => {
    const html = renderDashboard();

    expect(html).toContain('aria-label="Perfil financeiro da sessão"');
    expect(html).toContain("Não configurado");
    expect(html).toContain("Dashboard e Carteira não inventam moeda, risco, horizonte, reserva");
    expect(html).toContain("Estado somente em memória");
  });

  it("reads the shared validated profile without turning targets into current values", () => {
    const html = renderDashboard(PROFILE);

    expect(html).toContain("Disponível na sessão");
    expect(html).toContain("BRL");
    expect(html).toContain("Média");
    expect(html).toContain("Longo prazo");
    expect(html).toContain("BRL 15000,00");
    expect(html).toContain("Aposentadoria");
    expect(html).toContain("BRL 2000000,00");
    expect(html).toContain("Meta desejada declarada; não representa saldo atual");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain("saldo atual da reserva");
    expect(html).not.toMatch(/>\s*\d+%\s*</);
  });
});
