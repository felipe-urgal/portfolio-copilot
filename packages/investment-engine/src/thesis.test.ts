import { describe, expect, it } from "vitest";

import {
  buildInvestmentThesisTimeline,
  createInvestmentThesis,
  createInvestmentThesisEvent,
  createInvestmentThesisReview,
  InvalidInvestmentThesisInputError,
  InvalidInvestmentThesisTimelineError,
  reviseInvestmentThesis,
  type AnalyticalEvidenceInput,
  type CreateInvestmentThesisInput,
  type InvestmentThesisSnapshot,
} from "./index";

const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const CREATED_AT = "2026-01-01T10:00:00.000Z";
const EFFECTIVE_AT = "2026-01-01T10:00:00.000Z";

function evidence(
  evidenceId: string,
  asOf = "2025-12-31T00:00:00.000Z",
  retrievedAt = CREATED_AT,
): AnalyticalEvidenceInput {
  return {
    evidenceId,
    asOf,
    retrievedAt,
    provenance: {
      provider: "B3",
      sourceId: `source-${evidenceId}`,
      normalizationVersion: "1.0.0",
    },
  };
}

function thesisInput(
  overrides: Partial<CreateInvestmentThesisInput> = {},
): CreateInvestmentThesisInput {
  return {
    thesisId: "PETR4_BASE_CASE",
    assetId: ASSET_ID,
    createdAt: CREATED_AT,
    effectiveAt: EFFECTIVE_AT,
    thesisStatement: "A tese depende de disciplina de capital e geração de caixa resiliente.",
    facts: [
      {
        factId: "FREE_CASH_FLOW",
        statement: "A companhia reportou geração positiva de caixa livre.",
        evidence: [evidence("FCF_2025")],
      },
      {
        factId: "LEVERAGE",
        statement: "A alavancagem permanece dentro da faixa acompanhada.",
        evidence: [evidence("LEVERAGE_2025")],
      },
    ],
    drivers: [
      {
        pointId: "CAPITAL_DISCIPLINE",
        statement: "Disciplina de capital sustenta a criação de valor.",
        supportingFactIds: ["FREE_CASH_FLOW", "LEVERAGE"],
      },
    ],
    risks: [
      {
        pointId: "LEVERAGE_RISK",
        statement: "Aumento persistente de alavancagem enfraquece a tese.",
        supportingFactIds: ["LEVERAGE"],
      },
    ],
    monitoredIndicators: [
      {
        indicatorId: "NET_DEBT_EBITDA",
        name: "Dívida líquida / EBITDA",
        description: "Monitorar deterioração persistente de alavancagem.",
      },
    ],
    invalidationCriteria: [
      {
        criterionId: "LEVERAGE_BREAK",
        description: "Revisar a tese se a alavancagem ultrapassar o limite definido pela análise.",
        indicatorIds: ["NET_DEBT_EBITDA"],
      },
    ],
    reviewPolicy: { intervalDays: 30 },
    ...overrides,
  };
}

function initialThesis(): InvestmentThesisSnapshot {
  return createInvestmentThesis(thesisInput());
}

function revisedThesis(previous: InvestmentThesisSnapshot): InvestmentThesisSnapshot {
  return reviseInvestmentThesis(previous, {
    createdAt: "2026-01-20T10:00:00.000Z",
    effectiveAt: "2026-01-20T10:00:00.000Z",
    revisionReason: "Novo resultado alterou materialmente a expectativa de geração de caixa.",
    thesisStatement: "A tese revisada exige recuperação de caixa e manutenção da alavancagem.",
    facts: [
      {
        factId: "FREE_CASH_FLOW",
        statement: "O resultado mais recente mostrou menor geração de caixa livre.",
        evidence: [evidence("FCF_Q4_2025", "2026-01-15T00:00:00.000Z", "2026-01-20T09:00:00.000Z")],
      },
      {
        factId: "LEVERAGE",
        statement: "A alavancagem segue dentro da faixa acompanhada.",
        evidence: [
          evidence("LEVERAGE_Q4_2025", "2026-01-15T00:00:00.000Z", "2026-01-20T09:00:00.000Z"),
        ],
      },
    ],
    drivers: [
      {
        pointId: "CASH_RECOVERY",
        statement: "Recuperação de caixa passa a ser o principal driver monitorado.",
        supportingFactIds: ["FREE_CASH_FLOW"],
      },
    ],
    risks: [
      {
        pointId: "LEVERAGE_RISK",
        statement: "Alavancagem crescente junto com caixa fraco invalidaria o caso base.",
        supportingFactIds: ["FREE_CASH_FLOW", "LEVERAGE"],
      },
    ],
    monitoredIndicators: [
      {
        indicatorId: "NET_DEBT_EBITDA",
        name: "Dívida líquida / EBITDA",
        description: "Monitorar deterioração persistente de alavancagem.",
      },
      {
        indicatorId: "FREE_CASH_FLOW",
        name: "Fluxo de caixa livre",
        description: "Monitorar recuperação de geração de caixa.",
      },
    ],
    invalidationCriteria: [
      {
        criterionId: "CASH_AND_LEVERAGE_BREAK",
        description: "Invalidar se caixa não recuperar enquanto a alavancagem deteriora.",
        indicatorIds: ["FREE_CASH_FLOW", "NET_DEBT_EBITDA"],
      },
    ],
    reviewPolicy: { intervalDays: 30 },
  });
}

describe("InvestmentThesis", () => {
  it("keeps facts, analytical opinion and invalidation criteria separated and immutable", () => {
    const thesis = initialThesis();

    expect(thesis).toMatchObject({
      thesisId: "PETR4_BASE_CASE",
      assetId: ASSET_ID,
      version: 1,
      previousVersion: null,
      revisionReason: null,
      reviewPolicy: { intervalDays: 30 },
    });
    expect(thesis.facts.map((fact) => fact.factId)).toEqual(["FREE_CASH_FLOW", "LEVERAGE"]);
    expect(thesis.drivers[0]).toMatchObject({
      pointId: "CAPITAL_DISCIPLINE",
      supportingFactIds: ["FREE_CASH_FLOW", "LEVERAGE"],
    });
    expect(thesis.invalidationCriteria[0]).toMatchObject({
      criterionId: "LEVERAGE_BREAK",
      indicatorIds: ["NET_DEBT_EBITDA"],
    });
    expect(Object.isFrozen(thesis)).toBe(true);
    expect(Object.isFrozen(thesis.facts)).toBe(true);
    expect(Object.isFrozen(thesis.facts[0]?.evidence)).toBe(true);
  });

  it("rejects look-ahead evidence in thesis facts", () => {
    const input = thesisInput({
      facts: [
        {
          factId: "FUTURE_FACT",
          statement: "Fato conhecido apenas depois da tese.",
          evidence: [
            evidence("FUTURE_EVIDENCE", "2026-01-02T00:00:00.000Z", "2026-01-02T01:00:00.000Z"),
          ],
        },
      ],
      drivers: [
        {
          pointId: "DRIVER",
          statement: "Driver apoiado pelo fato futuro.",
          supportingFactIds: ["FUTURE_FACT"],
        },
      ],
      risks: [
        {
          pointId: "RISK",
          statement: "Risco apoiado pelo fato futuro.",
          supportingFactIds: ["FUTURE_FACT"],
        },
      ],
    });

    expect(() => createInvestmentThesis(input)).toThrowError(InvalidInvestmentThesisInputError);
  });

  it("creates a new immutable version instead of overwriting the previous thesis", () => {
    const first = initialThesis();
    const second = revisedThesis(first);

    expect(second).toMatchObject({
      thesisId: first.thesisId,
      assetId: first.assetId,
      version: 2,
      previousVersion: 1,
    });
    expect(second.revisionReason).toContain("materialmente");
    expect(first.version).toBe(1);
    expect(first.thesisStatement).not.toBe(second.thesisStatement);
    expect(Object.isFrozen(second)).toBe(true);
  });
});

describe("InvestmentThesis events and reviews", () => {
  it("records factual events with provenance and rejects evidence newer than the event", () => {
    const thesis = initialThesis();
    const event = createInvestmentThesisEvent(thesis, {
      eventId: "Q4_RESULT",
      occurredAt: "2026-01-15T12:00:00.000Z",
      recordedAt: "2026-01-15T13:00:00.000Z",
      type: "RESULT",
      summary: "Resultado trimestral publicado.",
      evidence: [evidence("Q4_RELEASE", "2026-01-15T12:00:00.000Z", "2026-01-15T12:30:00.000Z")],
    });

    expect(event).toMatchObject({
      thesisId: thesis.thesisId,
      assetId: thesis.assetId,
      thesisVersion: 1,
      type: "RESULT",
    });
    expect(Object.isFrozen(event.evidence)).toBe(true);

    expect(() =>
      createInvestmentThesisEvent(thesis, {
        eventId: "BAD_EVENT",
        occurredAt: "2026-01-15T12:00:00.000Z",
        recordedAt: "2026-01-16T12:00:00.000Z",
        type: "RESULT",
        summary: "Evento com evidência posterior ao fato descrito.",
        evidence: [
          evidence(
            "LOOKAHEAD_EVENT_EVIDENCE",
            "2026-01-16T00:00:00.000Z",
            "2026-01-16T01:00:00.000Z",
          ),
        ],
      }),
    ).toThrowError(InvalidInvestmentThesisTimelineError);
  });

  it("requires a material revision to be linked by an auditable REVISED review", () => {
    const first = initialThesis();
    const second = revisedThesis(first);
    const event = createInvestmentThesisEvent(first, {
      eventId: "Q4_RESULT",
      occurredAt: "2026-01-15T12:00:00.000Z",
      recordedAt: "2026-01-15T13:00:00.000Z",
      type: "RESULT",
      summary: "Resultado trimestral alterou a leitura da tese.",
      evidence: [evidence("Q4_RELEASE", "2026-01-15T12:00:00.000Z", "2026-01-15T12:30:00.000Z")],
    });
    const review = createInvestmentThesisReview(first, {
      reviewId: "Q4_REVIEW",
      reviewedAt: "2026-01-20T10:00:00.000Z",
      outcome: "REVISED",
      notes: "Mudança material exige uma nova versão da tese.",
      evidence: [evidence("REVIEW_BASIS", "2026-01-15T12:00:00.000Z", "2026-01-20T09:00:00.000Z")],
      relatedEventIds: [event.eventId],
      resultingVersion: 2,
    });

    expect(() =>
      buildInvestmentThesisTimeline({
        asOf: "2026-02-01T00:00:00.000Z",
        versions: [first, second],
        events: [event],
        reviews: [],
      }),
    ).toThrowError(InvalidInvestmentThesisTimelineError);

    const timeline = buildInvestmentThesisTimeline({
      asOf: "2026-02-01T00:00:00.000Z",
      versions: [first, second],
      events: [event],
      reviews: [review],
    });

    expect(timeline).toMatchObject({
      currentVersion: 2,
      lifecycleStatus: "ACTIVE",
      freshnessStatus: "CURRENT",
      reviewDueAt: "2026-02-19T10:00:00.000Z",
      reasonCodes: ["REVIEW_CURRENT"],
    });
    expect(timeline.entries.map((entry) => entry.entryType)).toEqual([
      "VERSION",
      "EVENT",
      "REVIEW",
      "VERSION",
    ]);
  });

  it("rejects an event assigned to a version after its successor becomes effective", () => {
    const first = initialThesis();
    const second = revisedThesis(first);
    const review = createInvestmentThesisReview(first, {
      reviewId: "VERSION_2_REVIEW",
      reviewedAt: "2026-01-20T10:00:00.000Z",
      outcome: "REVISED",
      notes: "Mudança material aprovada para a versão dois.",
      evidence: [evidence("VERSION_2_BASIS", "2026-01-19T00:00:00.000Z", "2026-01-20T09:00:00.000Z")],
      relatedEventIds: [],
      resultingVersion: 2,
    });
    const lateEvent = createInvestmentThesisEvent(first, {
      eventId: "LATE_OLD_VERSION_EVENT",
      occurredAt: "2026-01-25T12:00:00.000Z",
      recordedAt: "2026-01-25T13:00:00.000Z",
      type: "RESULT",
      summary: "Evento que já pertence ao período de vigência da versão dois.",
      evidence: [evidence("LATE_EVENT", "2026-01-25T12:00:00.000Z", "2026-01-25T12:30:00.000Z")],
    });

    expect(() =>
      buildInvestmentThesisTimeline({
        asOf: "2026-02-01T00:00:00.000Z",
        versions: [first, second],
        events: [lateEvent],
        reviews: [review],
      }),
    ).toThrowError(InvalidInvestmentThesisTimelineError);
  });

  it("marks an active thesis stale when its periodic review is overdue", () => {
    const thesis = initialThesis();
    const timeline = buildInvestmentThesisTimeline({
      asOf: "2026-02-01T10:00:00.001Z",
      versions: [thesis],
      events: [],
      reviews: [],
    });

    expect(timeline).toMatchObject({
      lifecycleStatus: "ACTIVE",
      freshnessStatus: "STALE",
      reviewDueAt: "2026-01-31T10:00:00.000Z",
      reasonCodes: ["REVIEW_OVERDUE"],
    });
  });

  it("makes invalidation explicit and stops treating periodic review as applicable", () => {
    const thesis = initialThesis();
    const review = createInvestmentThesisReview(thesis, {
      reviewId: "INVALIDATION_REVIEW",
      reviewedAt: "2026-01-25T10:00:00.000Z",
      outcome: "INVALIDATED",
      notes: "O critério de invalidação foi confirmado pelos fatos disponíveis.",
      evidence: [
        evidence("INVALIDATION_EVIDENCE", "2026-01-24T00:00:00.000Z", "2026-01-25T09:00:00.000Z"),
      ],
      relatedEventIds: [],
      resultingVersion: null,
    });

    const timeline = buildInvestmentThesisTimeline({
      asOf: "2026-03-01T00:00:00.000Z",
      versions: [thesis],
      events: [],
      reviews: [review],
    });

    expect(timeline).toMatchObject({
      lifecycleStatus: "INVALIDATED",
      freshnessStatus: "NOT_APPLICABLE",
      reviewDueAt: null,
      reasonCodes: ["THESIS_INVALIDATED"],
    });
  });
});
