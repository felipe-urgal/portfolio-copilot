import { describe, expect, it } from "vitest";

import { APP_NAME } from "./index";

describe("shared metadata", () => {
  it("keeps the canonical application name", () => {
    expect(APP_NAME).toBe("Portfolio Copilot");
  });
});
