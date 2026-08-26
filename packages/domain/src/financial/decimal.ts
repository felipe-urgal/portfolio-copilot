import { InvalidDecimalError } from "./errors";

export type DecimalParts = Readonly<{
  negative: boolean;
  whole: string;
  fraction: string;
}>;

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export function parseDecimalParts(value: string): DecimalParts {
  const normalized = value.trim();
  const match = DECIMAL_PATTERN.exec(normalized);

  if (!match) {
    throw new InvalidDecimalError(value);
  }

  const [, sign, whole = "0", fraction = ""] = match;

  return {
    negative: sign === "-",
    whole: whole.replace(/^0+(?=\d)/, ""),
    fraction,
  };
}

export function isDecimalZero(parts: DecimalParts): boolean {
  return /^0+$/.test(parts.whole) && !/[1-9]/.test(parts.fraction);
}

/**
 * Converts a base-10 decimal string to an integer at the requested scale.
 *
 * Rounding policy: half away from zero. The implementation never converts
 * the decimal to a JavaScript number, so binary floating-point drift cannot
 * enter financial calculations.
 */
export function parseScaledDecimal(value: string, scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0) {
    throw new RangeError("scale must be a non-negative integer");
  }

  const parts = parseDecimalParts(value);
  const factor = 10n ** BigInt(scale);
  const keptFraction = parts.fraction.slice(0, scale).padEnd(scale, "0");
  const discardedFraction = parts.fraction.slice(scale);
  const firstDiscardedDigit = discardedFraction.at(0);

  let absoluteUnits = BigInt(parts.whole) * factor;

  if (keptFraction.length > 0) {
    absoluteUnits += BigInt(keptFraction);
  }

  if (firstDiscardedDigit !== undefined && firstDiscardedDigit >= "5") {
    absoluteUnits += 1n;
  }

  if (absoluteUnits === 0n) {
    return 0n;
  }

  return parts.negative ? -absoluteUnits : absoluteUnits;
}

export function formatScaledDecimal(units: bigint, scale: number): string {
  if (!Number.isInteger(scale) || scale < 0) {
    throw new RangeError("scale must be a non-negative integer");
  }

  const negative = units < 0n;
  const absoluteUnits = negative ? -units : units;

  if (scale === 0) {
    return `${negative ? "-" : ""}${absoluteUnits.toString()}`;
  }

  const factor = 10n ** BigInt(scale);
  const whole = absoluteUnits / factor;
  const fraction = (absoluteUnits % factor).toString().padStart(scale, "0");

  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}
