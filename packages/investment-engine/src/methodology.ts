import {
  AssetClass,
  InstrumentType,
  type AssetClassCode,
  type InstrumentTypeCode,
} from "@portfolio-copilot/domain";

import { normalizeInvestmentIdentifier } from "./evidence";

export type InvestmentScoreKind = "QUALITY" | "OPPORTUNITY" | "DIVIDEND";
export type DividendScoreApplicability = "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";

export type InvestmentClassificationInput = Readonly<{
  assetClass: AssetClass | AssetClassCode | string;
  instrumentType: InstrumentType | InstrumentTypeCode | string;
  sector: string;
}>;

export type InvestmentClassification = Readonly<{
  assetClass: AssetClassCode;
  instrumentType: InstrumentTypeCode;
  sector: string;
}>;

export type ScoreComponentDefinitionInput = Readonly<{
  componentId: string;
  weightBps: number;
}>;

export type ScoreComponentDefinition = Readonly<{
  componentId: string;
  weightBps: number;
}>;

export type InvestmentMethodologyInput = Readonly<{
  methodologyId: string;
  version: string;
  classification: InvestmentClassificationInput;
  quality: readonly ScoreComponentDefinitionInput[];
  opportunity: readonly ScoreComponentDefinitionInput[];
  dividendApplicability: DividendScoreApplicability;
  dividend?: readonly ScoreComponentDefinitionInput[];
}>;

export type InvestmentMethodology = Readonly<{
  methodologyId: string;
  version: string;
  classification: InvestmentClassification;
  quality: readonly ScoreComponentDefinition[];
  opportunity: readonly ScoreComponentDefinition[];
  dividendApplicability: DividendScoreApplicability;
  dividend: readonly ScoreComponentDefinition[];
}>;

export class InvalidInvestmentMethodologyError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidInvestmentMethodologyError";
  }
}

const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const TOTAL_WEIGHT_BPS = 10_000;

function normalizeVersion(value: string): string {
  const normalized = value.trim();
  if (!VERSION_PATTERN.test(normalized)) {
    throw new InvalidInvestmentMethodologyError(`Invalid methodology version: ${JSON.stringify(value)}`);
  }

  return normalized;
}

function normalizeClassification(input: InvestmentClassificationInput): InvestmentClassification {
  const assetClass =
    input.assetClass instanceof AssetClass ? input.assetClass : AssetClass.from(input.assetClass);
  const instrumentType =
    input.instrumentType instanceof InstrumentType
      ? input.instrumentType
      : InstrumentType.from(input.instrumentType);

  return Object.freeze({
    assetClass: assetClass.code,
    instrumentType: instrumentType.code,
    sector: normalizeInvestmentIdentifier("sector", input.sector),
  });
}

function normalizeComponents(
  kind: InvestmentScoreKind,
  inputs: readonly ScoreComponentDefinitionInput[],
  required: boolean,
): readonly ScoreComponentDefinition[] {
  if (inputs.length === 0) {
    if (!required) return Object.freeze([]);
    throw new InvalidInvestmentMethodologyError(`${kind} methodology requires components.`);
  }

  const components = inputs.map((input) => {
    if (!Number.isSafeInteger(input.weightBps) || input.weightBps <= 0 || input.weightBps > TOTAL_WEIGHT_BPS) {
      throw new InvalidInvestmentMethodologyError(
        `Invalid ${kind} weight for ${input.componentId}: ${input.weightBps}`,
      );
    }

    return Object.freeze({
      componentId: normalizeInvestmentIdentifier("componentId", input.componentId),
      weightBps: input.weightBps,
    });
  });

  if (new Set(components.map((component) => component.componentId)).size !== components.length) {
    throw new InvalidInvestmentMethodologyError(`${kind} methodology contains duplicate components.`);
  }

  const totalWeight = components.reduce((sum, component) => sum + component.weightBps, 0);
  if (totalWeight !== TOTAL_WEIGHT_BPS) {
    throw new InvalidInvestmentMethodologyError(
      `${kind} methodology weights must sum to ${TOTAL_WEIGHT_BPS}, received ${totalWeight}.`,
    );
  }

  return Object.freeze(components);
}

export function createInvestmentMethodology(input: InvestmentMethodologyInput): InvestmentMethodology {
  const dividendApplicability = input.dividendApplicability;
  if (
    dividendApplicability !== "REQUIRED" &&
    dividendApplicability !== "OPTIONAL" &&
    dividendApplicability !== "NOT_APPLICABLE"
  ) {
    throw new InvalidInvestmentMethodologyError(
      `Invalid dividend applicability: ${String(dividendApplicability)}`,
    );
  }

  const dividendInputs = input.dividend ?? [];
  if (dividendApplicability === "NOT_APPLICABLE" && dividendInputs.length > 0) {
    throw new InvalidInvestmentMethodologyError(
      "Dividend components cannot be configured when dividend score is not applicable.",
    );
  }

  return Object.freeze({
    methodologyId: normalizeInvestmentIdentifier("methodologyId", input.methodologyId),
    version: normalizeVersion(input.version),
    classification: normalizeClassification(input.classification),
    quality: normalizeComponents("QUALITY", input.quality, true),
    opportunity: normalizeComponents("OPPORTUNITY", input.opportunity, true),
    dividendApplicability,
    dividend: normalizeComponents(
      "DIVIDEND",
      dividendInputs,
      dividendApplicability === "REQUIRED",
    ),
  });
}

function methodologyKey(methodologyId: string, version: string): string {
  return `${methodologyId}@${version}`;
}

function classificationKey(classification: InvestmentClassification): string {
  return `${classification.assetClass}:${classification.instrumentType}:${classification.sector}`;
}

export class InvestmentMethodologyRegistry {
  private readonly byMethodologyKey: ReadonlyMap<string, InvestmentMethodology>;
  private readonly byClassification: ReadonlyMap<string, readonly InvestmentMethodology[]>;

  public constructor(methodologies: readonly InvestmentMethodology[]) {
    const byMethodologyKey = new Map<string, InvestmentMethodology>();
    const byClassification = new Map<string, InvestmentMethodology[]>();

    for (const methodology of methodologies) {
      const key = methodologyKey(methodology.methodologyId, methodology.version);
      if (byMethodologyKey.has(key)) {
        throw new InvalidInvestmentMethodologyError(`Duplicate methodology ${key}.`);
      }
      byMethodologyKey.set(key, methodology);

      const classification = classificationKey(methodology.classification);
      const entries = byClassification.get(classification) ?? [];
      entries.push(methodology);
      byClassification.set(classification, entries);
    }

    this.byMethodologyKey = byMethodologyKey;
    this.byClassification = new Map(
      [...byClassification].map(([key, entries]) => [
        key,
        Object.freeze(
          [...entries].sort((left, right) =>
            methodologyKey(left.methodologyId, left.version).localeCompare(
              methodologyKey(right.methodologyId, right.version),
            ),
          ),
        ),
      ]),
    );
  }

  public get(methodologyId: string, version: string): InvestmentMethodology | null {
    const normalizedId = normalizeInvestmentIdentifier("methodologyId", methodologyId);
    const normalizedVersion = normalizeVersion(version);
    return this.byMethodologyKey.get(methodologyKey(normalizedId, normalizedVersion)) ?? null;
  }

  public findForClassification(
    classificationInput: InvestmentClassificationInput,
  ): readonly InvestmentMethodology[] {
    const classification = normalizeClassification(classificationInput);
    return this.byClassification.get(classificationKey(classification)) ?? Object.freeze([]);
  }
}
