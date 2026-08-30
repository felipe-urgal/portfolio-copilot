import { normalizeExternalIdentifier, type ExternalSourcePolicy } from "./source-policy";
import type { ExternalContentThreatFlag } from "./types";

const CANONICAL_UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CANONICAL_ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLASSIFIER_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const INVISIBLE_CONTROL_PATTERN = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
const METADATA_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const MAX_TITLE_CHARS = 512;
const MAX_SOURCE_DOCUMENT_ID_CHARS = 512;
const MAX_METADATA_ENTRIES = 32;
const MAX_METADATA_VALUE_CHARS = 512;
const DAY_MILLISECONDS = 86_400_000;

const THREAT_PATTERNS: readonly Readonly<{
  flag: ExternalContentThreatFlag;
  pattern: RegExp;
}>[] = Object.freeze([
  {
    flag: "INSTRUCTION_OVERRIDE",
    pattern:
      /\b(?:ignore|disregard|forget|override)\b.{0,80}\b(?:previous|prior|system|developer|instructions?|rules?)\b/isu,
  },
  {
    flag: "SYSTEM_PROMPT_EXFILTRATION",
    pattern:
      /\b(?:system prompt|developer message|hidden instructions?|reveal (?:the )?prompt|show (?:the )?prompt)\b/isu,
  },
  {
    flag: "TOOL_EXECUTION_REQUEST",
    pattern:
      /\b(?:call|invoke|execute|run|use)\b.{0,60}\b(?:tool|shell|terminal|command|api|function)\b/isu,
  },
  {
    flag: "AUTHORITY_SPOOFING",
    pattern: /(?:<\/?\s*(?:system|developer|assistant)\b|\[(?:SYSTEM|INST|DEVELOPER)\])/iu,
  },
]);

export function normalizeExternalInstant(field: string, value: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (
    !CANONICAL_UTC_INSTANT_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new Error(`Invalid ${field}.`);
  }
  return normalized;
}

export function normalizeExternalAssetId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!CANONICAL_ASSET_ID_PATTERN.test(normalized)) {
    throw new Error("Invalid classification assetId.");
  }
  return normalized;
}

export function normalizeClassifierVersion(value: string): string {
  const normalized = value.trim();
  if (!CLASSIFIER_VERSION_PATTERN.test(normalized)) {
    throw new Error("Invalid classifier version.");
  }
  return normalized;
}

export function normalizeExternalPlainText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTER_PATTERN, " ")
    .replace(INVISIBLE_CONTROL_PATTERN, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function normalizeExternalTitle(value: string): string {
  const normalized = normalizeExternalPlainText(value).replace(/\s*\n\s*/g, " ");
  if (normalized.length === 0 || normalized.length > MAX_TITLE_CHARS) {
    throw new Error("Invalid title.");
  }
  return normalized;
}

export function normalizeSourceDocumentId(value: string): string {
  const normalized = normalizeExternalPlainText(value);
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SOURCE_DOCUMENT_ID_CHARS ||
    normalized.includes("\n")
  ) {
    throw new Error("Invalid sourceDocumentId.");
  }
  return normalized;
}

export function normalizeExternalMetadata(
  input: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> {
  const entries = Object.entries(input ?? {});
  if (entries.length > MAX_METADATA_ENTRIES) {
    throw new Error("Too many metadata entries.");
  }

  const output: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, value] of entries) {
    if (
      !METADATA_KEY_PATTERN.test(key) ||
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      throw new Error("Invalid metadata key.");
    }

    const normalized = normalizeExternalPlainText(value);
    if (
      normalized.length === 0 ||
      normalized.length > MAX_METADATA_VALUE_CHARS ||
      normalized.includes("\n")
    ) {
      throw new Error("Invalid metadata value.");
    }
    output[key] = normalized;
  }

  return Object.freeze(output);
}

export function scanExternalContentThreats(
  values: readonly string[],
): readonly ExternalContentThreatFlag[] {
  const text = values.join("\n");
  const flags = THREAT_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ flag }) => flag);
  return Object.freeze([...new Set(flags)].sort());
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function addPolicyDays(instant: string, days: number): string {
  return new Date(new Date(instant).getTime() + days * DAY_MILLISECONDS).toISOString();
}

export function isExternalContentStale(
  policy: ExternalSourcePolicy,
  asOf: string,
  retrievedAt: string,
): boolean {
  return (
    new Date(retrievedAt).getTime() - new Date(asOf).getTime() >
    policy.staleAfterDays * DAY_MILLISECONDS
  );
}

export function normalizeClassificationReasonCodes(values: readonly string[]): readonly string[] {
  if (values.length === 0) return Object.freeze(["NO_MATCH"]);
  const normalized = values.map((value) =>
    normalizeExternalIdentifier("classification.reasonCode", value),
  );
  return Object.freeze([...new Set(normalized)].sort());
}

export function normalizePositiveVersion(field: string, value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}
