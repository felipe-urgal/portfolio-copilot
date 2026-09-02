import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const RECOMMENDATION_SOURCE = readFileSync(
  new URL("./contribution-recommendation-section.tsx", import.meta.url),
  "utf8",
);

describe("contribution recommendation validation focus", () => {
  it("focuses the invalid methodology control after submission", () => {
    expect(RECOMMENDATION_SOURCE).toContain('import { focusFirstInvalidField } from "./focus-invalid-field";');
    expect(RECOMMENDATION_SOURCE).toContain("focusFirstInvalidField(event.currentTarget)");
    expect(RECOMMENDATION_SOURCE).toContain("invalid={errors.methodologyVersion !== undefined}");
  });
});
