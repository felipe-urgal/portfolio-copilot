import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const HELPER_SOURCE = readFileSync(new URL("./focus-invalid-field.ts", import.meta.url), "utf8");
const BASELINE_SOURCE = readFileSync(
  new URL("./contribution-baseline-panel.tsx", import.meta.url),
  "utf8",
);
const CONCENTRATION_SOURCE = readFileSync(
  new URL("./contribution-concentration-section.tsx", import.meta.url),
  "utf8",
);
const EXECUTION_SOURCE = readFileSync(
  new URL("./contribution-execution-section.tsx", import.meta.url),
  "utf8",
);
const COST_SOURCE = readFileSync(
  new URL("./contribution-cost-section.tsx", import.meta.url),
  "utf8",
);

describe("contribution validation focus", () => {
  it("keeps invalid focus scoped to the submitted contribution form", () => {
    expect(HELPER_SOURCE).toContain("form.querySelector<HTMLElement>");
    expect(HELPER_SOURCE).toContain('[aria-invalid="true"], [data-invalid="true"]');
    expect(HELPER_SOURCE).toContain(
      "invalid.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)",
    );
    expect(
      BASELINE_SOURCE.match(/focusFirstInvalidField\(event\.currentTarget\)/gu),
    ).toHaveLength(2);
    expect(CONCENTRATION_SOURCE).toContain("focusFirstInvalidField(event.currentTarget)");
    expect(EXECUTION_SOURCE).toContain("focusFirstInvalidField(event.currentTarget)");
    expect(COST_SOURCE).toContain("focusFirstInvalidField(event.currentTarget)");
  });
});
