export type ExternalContentKind = "NEWS" | "DOCUMENT" | "RESULT";

export type ExternalSourcePolicyInput = Readonly<{
  sourceId: string;
  provider: string;
  allowedKinds: readonly ExternalContentKind[];
  allowedHosts: readonly string[];
  maxContentChars: number;
  staleAfterDays: number;
  retentionDays: number;
  normalizationVersion: string;
}>;

export type ExternalSourcePolicy = Readonly<{
  sourceId: string;
  provider: string;
  allowedKinds: readonly ExternalContentKind[];
  allowedHosts: readonly string[];
  maxContentChars: number;
  staleAfterDays: number;
  retentionDays: number;
  normalizationVersion: string;
}>;

export class InvalidExternalSourcePolicyError extends Error {
  public constructor(
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(`Invalid external source policy field ${field}: ${JSON.stringify(value)}`);
    this.name = "InvalidExternalSourcePolicyError";
  }
}

export class ExternalSourceNotAllowedError extends Error {
  public constructor(public readonly sourceId: string) {
    super(`External source ${sourceId} is not allowlisted.`);
    this.name = "ExternalSourceNotAllowedError";
  }
}

const IDENTIFIER_PATTERN = /^[A-Z0-9][A-Z0-9._:-]{0,127}$/;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const HOST_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_CONTENT_CHARS = 200_000;
const MAX_POLICY_DAYS = 36_500;

export function normalizeExternalIdentifier(field: string, value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new InvalidExternalSourcePolicyError(field, value);
  }
  return normalized;
}

function normalizeProvider(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!PROVIDER_PATTERN.test(normalized)) {
    throw new InvalidExternalSourcePolicyError("provider", value);
  }
  return normalized;
}

function normalizeVersion(value: string): string {
  const normalized = value.trim();
  if (!VERSION_PATTERN.test(normalized)) {
    throw new InvalidExternalSourcePolicyError("normalizationVersion", value);
  }
  return normalized;
}

function normalizeKinds(values: readonly ExternalContentKind[]): readonly ExternalContentKind[] {
  if (values.length === 0) {
    throw new InvalidExternalSourcePolicyError("allowedKinds", values);
  }

  const normalized = new Set<ExternalContentKind>();
  for (const value of values) {
    if (value !== "NEWS" && value !== "DOCUMENT" && value !== "RESULT") {
      throw new InvalidExternalSourcePolicyError("allowedKinds", value);
    }
    normalized.add(value);
  }

  return Object.freeze([...normalized].sort());
}

function normalizeHosts(values: readonly string[]): readonly string[] {
  if (values.length === 0) {
    throw new InvalidExternalSourcePolicyError("allowedHosts", values);
  }

  const normalized = new Set<string>();
  for (const value of values) {
    const host = value.trim().toLowerCase().replace(/\.$/, "");
    if (host.length === 0 || host.length > 253 || !HOST_PATTERN.test(host)) {
      throw new InvalidExternalSourcePolicyError("allowedHosts", value);
    }
    normalized.add(host);
  }

  return Object.freeze([...normalized].sort());
}

function normalizePositiveInteger(field: string, value: number, max: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > max) {
    throw new InvalidExternalSourcePolicyError(field, value);
  }
  return value;
}

export function createExternalSourcePolicy(input: ExternalSourcePolicyInput): ExternalSourcePolicy {
  const staleAfterDays = normalizePositiveInteger(
    "staleAfterDays",
    input.staleAfterDays,
    MAX_POLICY_DAYS,
  );
  const retentionDays = normalizePositiveInteger(
    "retentionDays",
    input.retentionDays,
    MAX_POLICY_DAYS,
  );
  if (retentionDays < staleAfterDays) {
    throw new InvalidExternalSourcePolicyError("retentionDays", input.retentionDays);
  }

  return Object.freeze({
    sourceId: normalizeExternalIdentifier("sourceId", input.sourceId),
    provider: normalizeProvider(input.provider),
    allowedKinds: normalizeKinds(input.allowedKinds),
    allowedHosts: normalizeHosts(input.allowedHosts),
    maxContentChars: normalizePositiveInteger(
      "maxContentChars",
      input.maxContentChars,
      MAX_CONTENT_CHARS,
    ),
    staleAfterDays,
    retentionDays,
    normalizationVersion: normalizeVersion(input.normalizationVersion),
  });
}

export class ExternalSourcePolicyRegistry {
  readonly #policies: ReadonlyMap<string, ExternalSourcePolicy>;

  public constructor(inputs: readonly ExternalSourcePolicyInput[]) {
    if (inputs.length === 0) {
      throw new InvalidExternalSourcePolicyError("policies", inputs);
    }

    const policies = new Map<string, ExternalSourcePolicy>();
    for (const input of inputs) {
      const policy = createExternalSourcePolicy(input);
      if (policies.has(policy.sourceId)) {
        throw new InvalidExternalSourcePolicyError("sourceId", input.sourceId);
      }
      policies.set(policy.sourceId, policy);
    }
    this.#policies = policies;
  }

  public resolve(sourceIdInput: string): ExternalSourcePolicy {
    const sourceId = normalizeExternalIdentifier("sourceId", sourceIdInput);
    const policy = this.#policies.get(sourceId);
    if (policy === undefined) {
      throw new ExternalSourceNotAllowedError(sourceId);
    }
    return policy;
  }

  public list(): readonly ExternalSourcePolicy[] {
    return Object.freeze(
      [...this.#policies.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    );
  }
}

export function isAllowedSourceUrl(policy: ExternalSourcePolicy, value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    (parsed.port.length > 0 && parsed.port !== "443")
  ) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  return policy.allowedHosts.some(
    (allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );
}
