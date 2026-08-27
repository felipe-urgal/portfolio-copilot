const MAX_OWNER_SUBJECT_LENGTH = 320;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

declare const ownerSubjectBrand: unique symbol;

export type OwnerSubject = string & Readonly<{ [ownerSubjectBrand]: true }>;

export class InvalidOwnerSubjectError extends Error {
  public constructor() {
    super("Authenticated owner subject is invalid.");
    this.name = "InvalidOwnerSubjectError";
  }
}

export function OwnerSubject(value: string): OwnerSubject {
  const normalized = value.trim();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_OWNER_SUBJECT_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidOwnerSubjectError();
  }

  return normalized as OwnerSubject;
}
