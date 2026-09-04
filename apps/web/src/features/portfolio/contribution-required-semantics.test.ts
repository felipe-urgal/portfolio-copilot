import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

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
const RECOMMENDATION_SOURCE = readFileSync(
  new URL("./contribution-recommendation-section.tsx", import.meta.url),
  "utf8",
);

describe("contribution required semantics", () => {
  it("exposes native required semantics for baseline and policy fields", () => {
    for (const id of [
      "contribution-portfolio-value",
      "contribution-amount",
      "minimum-meaningful-contribution",
      "max-contribution-destinations",
    ]) {
      expect(BASELINE_SOURCE).toContain(`htmlFor="${id}" required`);
      expect(BASELINE_SOURCE).toMatch(new RegExp(`id="${id}"\\s+required`));
    }

    expect(BASELINE_SOURCE).toContain("noValidate");
  });

  it("makes concentration limits required only while their class is enabled", () => {
    for (const id of ["softId", "hardId"]) {
      expect(CONCENTRATION_SOURCE).toContain(`htmlFor={${id}} required={row.enabled}`);
      expect(CONCENTRATION_SOURCE).toMatch(
        new RegExp(`id=\\{${id}\\}\\s+required=\\{row\\.enabled\\}`),
      );
    }

    expect(CONCENTRATION_SOURCE).toContain("disabled={!row.enabled}");
    expect(CONCENTRATION_SOURCE).toContain("noValidate");
  });

  it("exposes native required semantics for execution destination inputs", () => {
    expect(EXECUTION_SOURCE).toContain("htmlFor={assetSelectId} required");
    expect(EXECUTION_SOURCE).toMatch(/id=\{assetSelectId\}\s+required/);
    expect(EXECUTION_SOURCE).toContain('legend="Elegibilidade (obrigatório)"');
    expect(EXECUTION_SOURCE).toMatch(
      /name=\{`execution-eligibility-\$\{row\.assetClass\}`\}\s+required/g,
    );
    expect(EXECUTION_SOURCE).toContain("htmlFor={minimumId} required");
    expect(EXECUTION_SOURCE).toMatch(/id=\{minimumId\}\s+required/);
    expect(EXECUTION_SOURCE).toContain("noValidate");
  });

  it("exposes native required semantics for the audit snapshot methodology version", () => {
    expect(RECOMMENDATION_SOURCE).toContain(
      '<Label htmlFor="contribution-methodology-version" required>',
    );
    expect(RECOMMENDATION_SOURCE).toMatch(
      /id="contribution-methodology-version"\s+required/,
    );
    expect(RECOMMENDATION_SOURCE).toContain("noValidate");
  });
});
