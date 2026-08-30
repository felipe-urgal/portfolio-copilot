import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialSessionProvider } from "@/components/financial-session";

import PortfolioPage from "./page";

vi.mock("@/lib/identity-server", () => ({
  requireAuthenticatedIdentity: vi.fn(async () => ({
    subject: "github:test-user",
    displayName: "Usuário de teste",
    email: null,
    avatarUrl: null,
  })),
}));

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "USD",
  riskTolerance: "LOW",
  horizon: "SHORT",
  emergencyReserveTarget: null,
  goals: [],
};

async function renderPortfolio(initialFinancialProfile: FinancialProfileSnapshot | null) {
  const page = await PortfolioPage();

  return renderToStaticMarkup(
    <FinancialSessionProvider initialFinancialProfile={initialFinancialProfile}>
      {page}
    </FinancialSessionProvider>,
  );
}

describe("PortfolioPage financial session", () => {
  it("shows an explicit profile-absent state without blocking the local portfolio flow", async () => {
    const html = await renderPortfolio(null);

    expect(html).toContain('aria-label="Perfil financeiro da sessão"');
    expect(html).toContain("Não configurado");
    expect(html).toContain("Criar carteira");
    expect(html).toContain("Estado local");
    expect(html).toContain(
      "O domínio valida nome e moeda antes de liberar ativos e Transaction Ledger.",
    );
  });

  it("reads the same validated profile snapshot used by other product surfaces", async () => {
    const html = await renderPortfolio(PROFILE);

    expect(html).toContain("Somente nesta sessão");
    expect(html).toContain("USD");
    expect(html).toContain("Baixa");
    expect(html).toContain("Curto prazo");
    expect(html).toContain("Não definida");
    expect(html).toContain("Nenhum objetivo registrado no perfil desta sessão.");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain("0,00");
  });
});
