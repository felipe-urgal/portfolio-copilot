export class InvalidInvestmentDecimalError extends Error {
  public constructor(
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(`Invalid investment decimal field ${field}: ${JSON.stringify(value)}`);
    this.name = "InvalidInvestmentDecimalError";
  }
}

type ParsedDecimal = Readonly<{
  normalized: string;
  units: bigint;
  scale: number;
}>;

const MAX_DECIMAL_LENGTH = 128;
const MAX_DECIMAL_SCALE = 18;

export function parsePositiveInvestmentDecimal(field: string, value: string): ParsedDecimal {
  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_DECIMAL_LENGTH ||
    !/^\d+(?:\.\d+)?$/.test(trimmed)
  ) {
    throw new InvalidInvestmentDecimalError(field, value);
  }

  const [integerPart = "0", fractionalPart = ""] = trimmed.split(".");
  if (fractionalPart.length > MAX_DECIMAL_SCALE) {
    throw new InvalidInvestmentDecimalError(field, value);
  }

  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const fraction = fractionalPart.replace(/0+$/, "");
  const normalized = fraction.length > 0 ? `${integer}.${fraction}` : integer;
  const digits = `${integer}${fraction}`;
  const units = BigInt(digits);
  if (units <= 0n) throw new InvalidInvestmentDecimalError(field, value);

  return Object.freeze({ normalized, units, scale: fraction.length });
}

function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function alignDecimals(left: ParsedDecimal, right: ParsedDecimal): Readonly<{
  leftUnits: bigint;
  rightUnits: bigint;
}> {
  const scale = Math.max(left.scale, right.scale);
  return {
    leftUnits: left.units * pow10(scale - left.scale),
    rightUnits: right.units * pow10(scale - right.scale),
  };
}

function divideRoundedHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError("Investment decimal denominator must be positive.");

  const negative = numerator < 0n;
  const absoluteNumerator = negative ? -numerator : numerator;
  let quotient = absoluteNumerator / denominator;
  const remainder = absoluteNumerator % denominator;
  if (remainder * 2n >= denominator) quotient += 1n;

  return negative ? -quotient : quotient;
}

export function relativeDifferenceBasisPoints(
  reference: ParsedDecimal,
  comparison: ParsedDecimal,
): number {
  const aligned = alignDecimals(reference, comparison);
  const numerator = (aligned.comparisonUnits - aligned.leftUnits) * 10_000n;
  const result = divideRoundedHalfAwayFromZero(numerator, aligned.leftUnits);
  const numeric = Number(result);
  if (!Number.isSafeInteger(numeric)) {
    throw new InvalidInvestmentDecimalError("basisPoints", result.toString());
  }

  return numeric;
}
