import { describe, expect, it } from "vitest";

import { getApplicationHealth } from "./application-health";

describe("getApplicationHealth", () => {
  it("returns a stable healthy state", () => {
    expect(getApplicationHealth()).toEqual({
      service: "Portfolio Copilot",
      status: "ok",
    });
  });
});
