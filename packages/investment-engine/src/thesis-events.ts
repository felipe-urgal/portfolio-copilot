import {
  createAnalyticalEvidence,
  normalizeEvaluationInstant,
  normalizeInvestmentIdentifier,
  type AnalyticalEvidenceInput,
  type AnalyticalEvidenceSnapshot,
} from "./evidence";
import type { InvestmentThesisSnapshot } from "./thesis";

export type InvestmentThesisEventType =
  "RESULT" | "DRIVER_UPDATE" | "RISK_UPDATE" | "INDICATOR_UPDATE" | "INVALIDATION_SIGNAL" | "OTHER";

export type InvestmentThesisReviewOutcome = "CONFIRMED" | "REVISED" | "INVALIDATED";
export type InvestmentThesisLifecycleStatus = "ACTIVE" | "INVALIDATED";
export type InvestmentThesisFreshnessStatus = "CURRENT" | "STALE" | "NOT_APPLICABLE";
export type InvestmentThesisTimelineReasonCode =
  "REVIEW_CURRENT" | "REVIEW_OVERDUE" | "THESIS_INVALIDATED";

export type CreateInvestmentThesisEventInput = Readonly<{
  eventId: string;
  occurredAt: string;
  recordedAt: string;
  type: InvestmentThesisEventType;
  summary: string;
  evidence: readonly (AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot)[];
}>;

export type InvestmentThesisEventSnapshot = Readonly<{
  eventId: string;
  thesisId: string;
  assetId: string;
  thesisVersion: number;
  occurredAt: string;
  recordedAt: string;
  type: InvestmentThesisEventType;
  summary: string;
  evidence: readonly AnalyticalEvidenceSnapshot[];
}>;

export type CreateInvestmentThesisReviewInput = Readonly<{
  reviewId: string;
  reviewedAt: string;
  outcome: InvestmentThesisReviewOutcome;
  notes: string;
  evidence: readonly (AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot)[];
  relatedEventIds: readonly string[];
  resultingVersion: number | null;
}>;

export type InvestmentThesisReviewSnapshot = Readonly<{
  reviewId: string;
  thesisId: string;
  assetId: string;
  thesisVersion: number;
  reviewedAt: string;
  outcome: InvestmentThesisReviewOutcome;
  notes: string;
  evidence: readonly AnalyticalEvidenceSnapshot[];
  relatedEventIds: readonly string[];
  resultingVersion: number | null;
}>;

export type InvestmentThesisTimelineEntry = Readonly<{
  entryType: "VERSION" | "EVENT" | "REVIEW";
  referenceId: string;
  thesisVersion: number;
  at: string;
}>;

export type InvestmentThesisTimelineInput = Readonly<{
  asOf: string;
  versions: readonly InvestmentThesisSnapshot[];
  events: readonly InvestmentThesisEventSnapshot[];
  reviews: readonly InvestmentThesisReviewSnapshot[];
}>;

export type InvestmentThesisTimelineSnapshot = Readonly<{
  thesisId: string;
  assetId: string;
  asOf: string;
  currentVersion: number;
  lifecycleStatus: InvestmentThesisLifecycleStatus;
  freshnessStatus: InvestmentThesisFreshnessStatus;
  reviewDueAt: string | null;
  reasonCodes: readonly InvestmentThesisTimelineReasonCode[];
  versions: readonly InvestmentThesisSnapshot[];
  events: readonly InvestmentThesisEventSnapshot[];
  reviews: readonly InvestmentThesisReviewSnapshot[];
  entries: readonly InvestmentThesisTimelineEntry[];
}>;

export class InvalidInvestmentThesisTimelineError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidInvestmentThesisTimelineError";
  }
}

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const MAX_SUMMARY_LENGTH = 2_000;
const DAY_MILLISECONDS = 86_400_000;

function normalizeText(field: string, value: string): string {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SUMMARY_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidInvestmentThesisTimelineError(`Invalid ${field}.`);
  }
  return normalized;
}

function normalizeEventType(value: InvestmentThesisEventType): InvestmentThesisEventType {
  switch (value) {
    case "RESULT":
    case "DRIVER_UPDATE":
    case "RISK_UPDATE":
    case "INDICATOR_UPDATE":
    case "INVALIDATION_SIGNAL":
    case "OTHER":
      return value;
    default:
      throw new InvalidInvestmentThesisTimelineError(
        `Invalid thesis event type: ${String(value)}.`,
      );
  }
}

function normalizeReviewOutcome(
  value: InvestmentThesisReviewOutcome,
): InvestmentThesisReviewOutcome {
  switch (value) {
    case "CONFIRMED":
    case "REVISED":
    case "INVALIDATED":
      return value;
    default:
      throw new InvalidInvestmentThesisTimelineError(
        `Invalid thesis review outcome: ${String(value)}.`,
      );
  }
}

function normalizeEvidence(
  field: string,
  entries: readonly (AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot)[],
  knownAt: string,
  factAsOf: string | null,
): readonly AnalyticalEvidenceSnapshot[] {
  if (entries.length === 0) {
    throw new InvalidInvestmentThesisTimelineError(`${field} requires provenance evidence.`);
  }

  const evidence = entries.map((entry) => createAnalyticalEvidence(entry));
  for (const entry of evidence) {
    if (entry.retrievedAt > knownAt || entry.asOf > knownAt) {
      throw new InvalidInvestmentThesisTimelineError(`${field} contains look-ahead evidence.`);
    }
    if (factAsOf !== null && entry.asOf > factAsOf) {
      throw new InvalidInvestmentThesisTimelineError(
        `${field} contains evidence newer than the event it supports.`,
      );
    }
  }

  return Object.freeze(evidence);
}

function normalizeUniqueIds(field: string, values: readonly string[]): readonly string[] {
  const normalized = values.map((value) => normalizeInvestmentIdentifier(field, value));
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new InvalidInvestmentThesisTimelineError(`${field} contains duplicate identifiers.`);
  }
  return Object.freeze([...normalized].sort());
}

export function createInvestmentThesisEvent(
  thesis: InvestmentThesisSnapshot,
  input: CreateInvestmentThesisEventInput,
): InvestmentThesisEventSnapshot {
  const occurredAt = normalizeEvaluationInstant("occurredAt", input.occurredAt);
  const recordedAt = normalizeEvaluationInstant("recordedAt", input.recordedAt);
  if (occurredAt < thesis.effectiveAt) {
    throw new InvalidInvestmentThesisTimelineError(
      "Thesis event cannot occur before the referenced thesis version is effective.",
    );
  }
  if (recordedAt < occurredAt) {
    throw new InvalidInvestmentThesisTimelineError(
      "Thesis event recordedAt cannot precede occurredAt.",
    );
  }

  return Object.freeze({
    eventId: normalizeInvestmentIdentifier("eventId", input.eventId),
    thesisId: thesis.thesisId,
    assetId: thesis.assetId,
    thesisVersion: thesis.version,
    occurredAt,
    recordedAt,
    type: normalizeEventType(input.type),
    summary: normalizeText("event summary", input.summary),
    evidence: normalizeEvidence("event evidence", input.evidence, recordedAt, occurredAt),
  });
}

export function createInvestmentThesisReview(
  thesis: InvestmentThesisSnapshot,
  input: CreateInvestmentThesisReviewInput,
): InvestmentThesisReviewSnapshot {
  const reviewedAt = normalizeEvaluationInstant("reviewedAt", input.reviewedAt);
  if (reviewedAt < thesis.effectiveAt) {
    throw new InvalidInvestmentThesisTimelineError(
      "Thesis review cannot occur before the referenced thesis version is effective.",
    );
  }

  const outcome = normalizeReviewOutcome(input.outcome);
  if (outcome === "REVISED") {
    if (input.resultingVersion !== thesis.version + 1) {
      throw new InvalidInvestmentThesisTimelineError(
        `A REVISED review must point to version ${thesis.version + 1}.`,
      );
    }
  } else if (input.resultingVersion !== null) {
    throw new InvalidInvestmentThesisTimelineError(
      `${outcome} review cannot point to a resulting thesis version.`,
    );
  }

  return Object.freeze({
    reviewId: normalizeInvestmentIdentifier("reviewId", input.reviewId),
    thesisId: thesis.thesisId,
    assetId: thesis.assetId,
    thesisVersion: thesis.version,
    reviewedAt,
    outcome,
    notes: normalizeText("review notes", input.notes),
    evidence: normalizeEvidence("review evidence", input.evidence, reviewedAt, null),
    relatedEventIds: normalizeUniqueIds("relatedEventIds", input.relatedEventIds),
    resultingVersion: input.resultingVersion,
  });
}

function addDays(instant: string, days: number): string {
  const milliseconds = new Date(instant).getTime() + days * DAY_MILLISECONDS;
  return new Date(milliseconds).toISOString();
}

function assertSameThesis(
  thesisId: string,
  assetId: string,
  candidate: Readonly<{ thesisId: string; assetId: string }>,
  label: string,
): void {
  if (candidate.thesisId !== thesisId || candidate.assetId !== assetId) {
    throw new InvalidInvestmentThesisTimelineError(`${label} belongs to another thesis or asset.`);
  }
}

function normalizeVersions(
  input: readonly InvestmentThesisSnapshot[],
  asOf: string,
): readonly InvestmentThesisSnapshot[] {
  if (input.length === 0) {
    throw new InvalidInvestmentThesisTimelineError(
      "Thesis timeline requires at least one version.",
    );
  }

  const versions = [...input].sort((left, right) => left.version - right.version);
  const thesisId = versions[0]?.thesisId;
  const assetId = versions[0]?.assetId;
  if (thesisId === undefined || assetId === undefined) {
    throw new InvalidInvestmentThesisTimelineError(
      "Thesis timeline requires a valid first version.",
    );
  }

  for (let index = 0; index < versions.length; index += 1) {
    const version = versions[index];
    if (version === undefined) continue;
    assertSameThesis(thesisId, assetId, version, `Thesis version ${version.version}`);
    const expectedVersion = index + 1;
    const expectedPrevious = expectedVersion === 1 ? null : expectedVersion - 1;
    if (version.version !== expectedVersion || version.previousVersion !== expectedPrevious) {
      throw new InvalidInvestmentThesisTimelineError(
        "Thesis versions must form a contiguous immutable sequence starting at version 1.",
      );
    }
    if (version.effectiveAt > asOf || version.createdAt > asOf) {
      throw new InvalidInvestmentThesisTimelineError("Thesis timeline contains a future version.");
    }
    const previous = versions[index - 1];
    if (previous !== undefined && version.effectiveAt <= previous.effectiveAt) {
      throw new InvalidInvestmentThesisTimelineError(
        "Thesis versions must become effective in strictly increasing time order.",
      );
    }
  }

  return Object.freeze(versions);
}

function normalizeEvents(
  inputs: readonly InvestmentThesisEventSnapshot[],
  thesisId: string,
  assetId: string,
  versionsByNumber: ReadonlyMap<number, InvestmentThesisSnapshot>,
  asOf: string,
): readonly InvestmentThesisEventSnapshot[] {
  const seen = new Set<string>();
  for (const event of inputs) {
    assertSameThesis(thesisId, assetId, event, `Thesis event ${event.eventId}`);
    if (seen.has(event.eventId)) {
      throw new InvalidInvestmentThesisTimelineError(`Duplicate thesis event ${event.eventId}.`);
    }
    seen.add(event.eventId);

    const version = versionsByNumber.get(event.thesisVersion);
    const nextVersion = versionsByNumber.get(event.thesisVersion + 1);
    if (
      version === undefined ||
      event.occurredAt < version.effectiveAt ||
      (nextVersion !== undefined && event.occurredAt >= nextVersion.effectiveAt)
    ) {
      throw new InvalidInvestmentThesisTimelineError(
        `Thesis event ${event.eventId} references an invalid thesis version.`,
      );
    }
    if (event.recordedAt > asOf) {
      throw new InvalidInvestmentThesisTimelineError(
        `Thesis event ${event.eventId} is in the future.`,
      );
    }
  }

  return Object.freeze(
    [...inputs].sort((left, right) =>
      left.recordedAt === right.recordedAt
        ? left.eventId.localeCompare(right.eventId)
        : left.recordedAt.localeCompare(right.recordedAt),
    ),
  );
}

function normalizeReviews(
  inputs: readonly InvestmentThesisReviewSnapshot[],
  thesisId: string,
  assetId: string,
  versionsByNumber: ReadonlyMap<number, InvestmentThesisSnapshot>,
  eventsById: ReadonlyMap<string, InvestmentThesisEventSnapshot>,
  asOf: string,
): readonly InvestmentThesisReviewSnapshot[] {
  const seen = new Set<string>();
  for (const review of inputs) {
    assertSameThesis(thesisId, assetId, review, `Thesis review ${review.reviewId}`);
    if (seen.has(review.reviewId)) {
      throw new InvalidInvestmentThesisTimelineError(`Duplicate thesis review ${review.reviewId}.`);
    }
    seen.add(review.reviewId);

    const version = versionsByNumber.get(review.thesisVersion);
    const nextVersion = versionsByNumber.get(review.thesisVersion + 1);
    if (
      version === undefined ||
      review.reviewedAt < version.effectiveAt ||
      (nextVersion !== undefined && review.reviewedAt > nextVersion.effectiveAt)
    ) {
      throw new InvalidInvestmentThesisTimelineError(
        `Thesis review ${review.reviewId} references an invalid thesis version.`,
      );
    }
    if (review.reviewedAt > asOf) {
      throw new InvalidInvestmentThesisTimelineError(
        `Thesis review ${review.reviewId} is in the future.`,
      );
    }

    for (const eventId of review.relatedEventIds) {
      const event = eventsById.get(eventId);
      if (event === undefined || event.recordedAt > review.reviewedAt) {
        throw new InvalidInvestmentThesisTimelineError(
          `Thesis review ${review.reviewId} references unavailable event ${eventId}.`,
        );
      }
    }

    if (review.outcome === "REVISED") {
      const resultingVersion = review.resultingVersion;
      const revised =
        resultingVersion === null ? undefined : versionsByNumber.get(resultingVersion);
      if (
        revised === undefined ||
        revised.previousVersion !== review.thesisVersion ||
        revised.createdAt < review.reviewedAt ||
        revised.effectiveAt < review.reviewedAt
      ) {
        throw new InvalidInvestmentThesisTimelineError(
          `Thesis review ${review.reviewId} does not resolve to its audited revised version.`,
        );
      }
    }
  }

  return Object.freeze(
    [...inputs].sort((left, right) =>
      left.reviewedAt === right.reviewedAt
        ? left.reviewId.localeCompare(right.reviewId)
        : left.reviewedAt.localeCompare(right.reviewedAt),
    ),
  );
}

function assertRevisionReviews(
  versions: readonly InvestmentThesisSnapshot[],
  reviews: readonly InvestmentThesisReviewSnapshot[],
): void {
  for (const version of versions.slice(1)) {
    const matches = reviews.filter(
      (review) =>
        review.outcome === "REVISED" &&
        review.thesisVersion === version.version - 1 &&
        review.resultingVersion === version.version,
    );
    if (matches.length !== 1) {
      throw new InvalidInvestmentThesisTimelineError(
        `Thesis version ${version.version} requires exactly one auditable REVISED review.`,
      );
    }
  }
}

function buildEntries(
  versions: readonly InvestmentThesisSnapshot[],
  events: readonly InvestmentThesisEventSnapshot[],
  reviews: readonly InvestmentThesisReviewSnapshot[],
): readonly InvestmentThesisTimelineEntry[] {
  const entries: InvestmentThesisTimelineEntry[] = [
    ...versions.map((version) =>
      Object.freeze({
        entryType: "VERSION" as const,
        referenceId: `VERSION:${version.version}`,
        thesisVersion: version.version,
        at: version.effectiveAt,
      }),
    ),
    ...events.map((event) =>
      Object.freeze({
        entryType: "EVENT" as const,
        referenceId: event.eventId,
        thesisVersion: event.thesisVersion,
        at: event.recordedAt,
      }),
    ),
    ...reviews.map((review) =>
      Object.freeze({
        entryType: "REVIEW" as const,
        referenceId: review.reviewId,
        thesisVersion: review.thesisVersion,
        at: review.reviewedAt,
      }),
    ),
  ];

  const entryPriority: Readonly<Record<InvestmentThesisTimelineEntry["entryType"], number>> = {
    EVENT: 0,
    REVIEW: 1,
    VERSION: 2,
  };

  entries.sort((left, right) => {
    if (left.at !== right.at) return left.at.localeCompare(right.at);
    if (left.entryType !== right.entryType) {
      return entryPriority[left.entryType] - entryPriority[right.entryType];
    }
    return left.referenceId.localeCompare(right.referenceId);
  });

  return Object.freeze(entries);
}

export function buildInvestmentThesisTimeline(
  input: InvestmentThesisTimelineInput,
): InvestmentThesisTimelineSnapshot {
  const asOf = normalizeEvaluationInstant("asOf", input.asOf);
  const versions = normalizeVersions(input.versions, asOf);
  const first = versions[0];
  const current = versions[versions.length - 1];
  if (first === undefined || current === undefined) {
    throw new InvalidInvestmentThesisTimelineError("Thesis timeline requires a current version.");
  }

  const versionsByNumber = new Map(versions.map((version) => [version.version, version]));
  const events = normalizeEvents(
    input.events,
    first.thesisId,
    first.assetId,
    versionsByNumber,
    asOf,
  );
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const reviews = normalizeReviews(
    input.reviews,
    first.thesisId,
    first.assetId,
    versionsByNumber,
    eventsById,
    asOf,
  );
  assertRevisionReviews(versions, reviews);

  const currentReviews = reviews.filter((review) => review.thesisVersion === current.version);
  const latestCurrentReview = currentReviews[currentReviews.length - 1] ?? null;
  const lifecycleStatus: InvestmentThesisLifecycleStatus =
    latestCurrentReview?.outcome === "INVALIDATED" ? "INVALIDATED" : "ACTIVE";

  let freshnessStatus: InvestmentThesisFreshnessStatus;
  let reviewDueAt: string | null;
  let reasonCodes: readonly InvestmentThesisTimelineReasonCode[];
  if (lifecycleStatus === "INVALIDATED") {
    freshnessStatus = "NOT_APPLICABLE";
    reviewDueAt = null;
    reasonCodes = Object.freeze(["THESIS_INVALIDATED"] as const);
  } else {
    const reviewAnchor = latestCurrentReview?.reviewedAt ?? current.effectiveAt;
    reviewDueAt = addDays(reviewAnchor, current.reviewPolicy.intervalDays);
    freshnessStatus = asOf > reviewDueAt ? "STALE" : "CURRENT";
    reasonCodes = Object.freeze(
      freshnessStatus === "STALE" ? (["REVIEW_OVERDUE"] as const) : (["REVIEW_CURRENT"] as const),
    );
  }

  return Object.freeze({
    thesisId: first.thesisId,
    assetId: first.assetId,
    asOf,
    currentVersion: current.version,
    lifecycleStatus,
    freshnessStatus,
    reviewDueAt,
    reasonCodes,
    versions,
    events,
    reviews,
    entries: buildEntries(versions, events, reviews),
  });
}
