import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialSessionProvider } from "@/components/financial-session";

import PortfolioPage from "./page";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "USD",
  riskTolerance: "LOW",
  horizon: "SHORT",
  emergencyReserveTarget: null,
  goals: [],
};

function renderPortfolio(initialFinancialProfile: FinancialProfileSnapshot | null): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider initialFinancialProfile={initialFinancialProfile}>
      <PortfolioPage />
    </FinancialSessionProvider>,
  );
}

describe("PortfolioPage financial session", () => {
  it("shows an explicit profile-absent state without blocking the local portfolio flow", () => {
    const html = renderPortfolio(null);

    expect(html).toContain('aria-label="Perfil financeiro da sessão"');
    expect(html).toContain("Não configurado");
    expect(html).toContain("Criar carteira");
    expect(html).toContain("Nada é persistido nesta versão");
  });

  it("reads the same validated profile snapshot used by other product surfaces", () => {
    const html = renderPortfolio(PROFILE);

    expect(html).toContain("Disponível na sessão");
    expect(html).toContain("USD");
    expect(html).toContain("Baixa");
    expect(html).toContain("Curto prazo");
    expect(html).toContain("Não definida");
    expect(html).toContain("Nenhum objetivo registrado no perfil desta sessão.");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain("0,00");
  });
});
