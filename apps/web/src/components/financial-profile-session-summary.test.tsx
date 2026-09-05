import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialProfileSessionSummary } from "./financial-profile-session-summary";
import {
  FinancialSessionProvider,
  type FinancialProfilePersistenceStatus,
} from "./financial-session";

const SUMMARY_SOURCE = readFileSync(
  new URL("./financial-profile-session-summary.tsx", import.meta.url),
  "utf8",
);

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

function renderSummary(
  initialFinancialProfile: FinancialProfileSnapshot | null,
  initialPersistenceStatus: FinancialProfilePersistenceStatus = "memory-only",
): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider
      initialFinancialProfile={initialFinancialProfile}
      initialPersistenceStatus={initialPersistenceStatus}
    >
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

  it("announces asynchronous session-profile status changes from the persistent summary", () => {
    const html = renderSummary(null);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    expect(SUMMARY_SOURCE).toContain('role="status"');
    expect(SUMMARY_SOURCE).toContain('aria-live="polite"');
    expect(SUMMARY_SOURCE).toContain('aria-atomic="true"');
  });

  it("renders profile, reserve target and goals from the shared snapshot without exposing ids", () => {
    const html = renderSummary(PROFILE);

    expect(html).toContain("Somente nesta sessão");
    expect(html).toContain("BRL");
    expect(html).toContain("Média");
    expect(html).toContain("Longo prazo");
    expect(html).toContain("BRL 30000,00");
    expect(html).toContain("Patrimônio");
    expect(html).toContain("BRL 1000000,00");
    expect(html).toContain("Objetivo com data");
    expect(html).toContain("Até 31/12/2030");
    expect(html).toContain("Meta desejada declarada; não representa saldo atual");
    expect(html).toContain("ainda não está salvo neste dispositivo");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain(PROFILE.goals[0]?.id ?? "missing-goal-id");
  });

  it("distinguishes a locally persisted profile from a memory-only session", () => {
    const html = renderSummary(PROFILE, "persisted");

    expect(html).toContain("Salvo neste dispositivo");
    expect(html).toContain("Remover cópia local do perfil");
    expect(html).toContain("salvo localmente neste navegador");
    expect(html).toContain("Não existe sincronização automática com conta ou outro dispositivo");
    expect(html).toContain("A migração para a conta é uma ação separada no Dashboard");
  });

  it("preserves focus after removing the persisted profile copy", () => {
    const html = renderSummary(PROFILE, "persisted");

    expect(html).toContain('tabindex="-1"');
    expect(SUMMARY_SOURCE).toContain("focusSessionNoteAfterRemovalRef.current = true");
    expect(SUMMARY_SOURCE).toContain(
      "if (!focusSessionNoteAfterRemovalRef.current || isPersisted) return;",
    );
    expect(SUMMARY_SOURCE).toContain("sessionNoteRef.current?.focus()");
    expect(SUMMARY_SOURCE).toContain("onClick={handleRemovePersistedFinancialProfile}");
    expect(SUMMARY_SOURCE).toContain("ref={sessionNoteRef}");
  });

  it("distinguishes missing reserve and goals from zero or progress", () => {
    const html = renderSummary({ ...PROFILE, emergencyReserveTarget: null, goals: [] });

    expect(html).toContain("Não definida");
    expect(html).toContain("Nenhum objetivo registrado no perfil desta sessão.");
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });
});
