import { describe, expect, it } from "vitest";

import { AssetId, InvalidAssetIdError } from "./index";

describe("AssetId", () => {
  it("accepts canonical UUID identities and normalizes case", () => {
    const id = AssetId.from("550E8400-E29B-41D4-A716-446655440000");

    expect(id.toString()).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("compares identities by value", () => {
    expect(
      AssetId.from("550e8400-e29b-41d4-a716-446655440000").equals(
        AssetId.from("550E8400-E29B-41D4-A716-446655440000"),
      ),
    ).toBe(true);
  });

  it("rejects empty, malformed and nil identities", () => {
    expect(() => AssetId.from("")).toThrowError(InvalidAssetIdError);
    expect(() => AssetId.from("ITUB4")).toThrowError(InvalidAssetIdError);
    expect(() => AssetId.from("00000000-0000-0000-0000-000000000000")).toThrowError(
      InvalidAssetIdError,
    );
  });
});
