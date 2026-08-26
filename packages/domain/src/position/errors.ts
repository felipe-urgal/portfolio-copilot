export type PositionDomainErrorCode = "INSUFFICIENT_ASSET_POSITION";

export class PositionDomainError extends Error {
  public constructor(
    public readonly code: PositionDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InsufficientAssetPositionError extends PositionDomainError {
  public constructor(
    public readonly portfolioId: string,
    public readonly assetId: string,
    public readonly transactionId: string,
    public readonly availableQuantity: string,
    public readonly requestedQuantity: string,
  ) {
    super(
      "INSUFFICIENT_ASSET_POSITION",
      `Transaction ${transactionId} cannot sell ${requestedQuantity} of asset ${assetId} in portfolio ${portfolioId}; available position is ${availableQuantity}`,
    );
  }
}
