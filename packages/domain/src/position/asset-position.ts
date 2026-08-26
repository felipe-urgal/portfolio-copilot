import type { AssetId, AssetQuantity } from "../asset";

export type AssetPosition = Readonly<{
  assetId: AssetId;
  quantity: AssetQuantity;
}>;
