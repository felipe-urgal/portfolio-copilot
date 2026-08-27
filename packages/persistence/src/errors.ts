export class OwnedResourceNotFoundError extends Error {
  public constructor(resource: "portfolio") {
    super(`${resource} was not found for the authenticated owner.`);
    this.name = "OwnedResourceNotFoundError";
  }
}

export class ImmutableLedgerConflictError extends Error {
  public constructor() {
    super("Transaction identity already exists with different immutable content.");
    this.name = "ImmutableLedgerConflictError";
  }
}
