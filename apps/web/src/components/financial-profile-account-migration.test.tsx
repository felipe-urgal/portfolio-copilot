import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialProfileAccountMigration } from "./financial-profile-account-migration";
import { FinancialSessionProvider } from "./financial-session";

const MIGRATION_SOURCE = readFileSync(
  new URL("./financial-profile-account-migration.tsx", import.meta.url),
  "utf8",
);

const LOCAL_PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "3000000" },
  goals: [],
};

function renderMigration(accountProfile: FinancialProfileSnapshot | null): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider
      initialFinancialProfile={LOCAL_PROFILE}
      initialPersistenceStatus="persisted"
    >
      <FinancialProfileAccountMigration initialAccountProfile={accountProfile} />
    </FinancialSessionProvider>,
  );
}

describe("FinancialProfileAccountMigration", () => {
  it("requires an explicit action before copying a local profile into an empty account", () => {
    const html = renderMigration(null);

    expect(html).toContain("Migração opt-in");
    expect(html).toContain("não é enviado automaticamente");
    expect(html).toContain("A conta ainda não possui um perfil financeiro.");
    expect(html).toContain('role="status"');
    expect(html).toContain("Salvar perfil local na conta");
    expect(html).toContain("Manter somente local");
    expect(html).toContain("Remover cópia local");
  });

  it("keeps account migration actions on the canonical touch-target size", () => {
    expect(MIGRATION_SOURCE).not.toContain('size="sm"');
  });

  it("shows an idempotent aligned state as canonical success feedback", () => {
    const html = renderMigration(LOCAL_PROFILE);

    expect(html).toContain("Perfis alinhados");
    expect(html).toContain("estão alinhados");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Salvar perfil local na conta");
    expect(html).toContain("Remover cópia local");
  });

  it("keeps conflict details auditable behind progressive disclosure", () => {
    const accountProfile: FinancialProfileSnapshot = {
      ...LOCAL_PROFILE,
      id: "a49503f0-27d2-4f4d-8248-2c48d95765e0",
      riskTolerance: "HIGH",
      horizon: "SHORT",
    };
    const html = renderMigration(accountProfile);

    expect(html).toContain("Existe um conflito");
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Revisar diferenças");
    expect(html).toContain("3 diferenças");
    expect(html).toContain('aria-label="Diferenças entre perfil local e da conta"');
    expect(html).toContain("Identidade interna do perfil");
    expect(html).toContain("Tolerância a risco");
    expect(html).toContain("Horizonte financeiro");
    expect(html).toContain("Substituir perfil da conta pelo local");
    expect(html).toContain("Manter somente local");
    expect(html).not.toContain(accountProfile.id);
    expect(html).not.toContain(LOCAL_PROFILE.id);
  });
});
