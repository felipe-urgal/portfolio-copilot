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
const COST_SOURCE = readFileSync(new URL("./contribution-cost-section.tsx", import.meta.url), "utf8");
const RECOMMENDATION_SOURCE = readFileSync(
  new URL("./contribution-recommendation-section.tsx", import.meta.url),
  "utf8",
);
const BASELINE_CSS = readFileSync(
  new URL("./contribution-baseline-panel.module.css", import.meta.url),
  "utf8",
);

function expectNamedScrollRegion(source: string, label: string): void {
  const labelIndex = source.indexOf(`aria-label="${label}"`);

  expect(labelIndex).toBeGreaterThan(-1);

  const regionStart = source.lastIndexOf("<div", labelIndex);
  const regionEnd = source.indexOf(">", labelIndex);
  const openingTag = source.slice(regionStart, regionEnd + 1);

  expect(openingTag).toContain("className={styles.tableScroller}");
  expect(openingTag).toContain('role="region"');
  expect(openingTag).toContain("tabIndex={0}");
}

describe("contribution horizontal scroll regions", () => {
  it("keeps baseline input and baseline/policy results keyboard reachable and named", () => {
    expectNamedScrollRegion(BASELINE_SOURCE, "Alvo e valores atuais do aporte");
    expectNamedScrollRegion(BASELINE_SOURCE, "Resultado do baseline e da política");
  });

  it("keeps concentration results keyboard reachable and named", () => {
    expectNamedScrollRegion(CONCENTRATION_SOURCE, "Resultado dos limites de concentração");
  });

  it("keeps execution and known-cost results keyboard reachable and named", () => {
    expectNamedScrollRegion(EXECUTION_SOURCE, "Resultado das restrições de execução");
    expectNamedScrollRegion(COST_SOURCE, "Resultado dos custos conhecidos");
  });

  it("keeps the final auditable snapshot decisions keyboard reachable and named", () => {
    expectNamedScrollRegion(RECOMMENDATION_SOURCE, "Decisões do snapshot auditável");
  });

  it("shows the canonical focus ring when a horizontal scroll region receives focus", () => {
    expect(BASELINE_CSS).toMatch(
      /\.tableScroller:focus-visible\s*\{[\s\S]*outline: var\(--focus-ring-width\) solid var\(--color-focus-ring\);[\s\S]*outline-offset: var\(--focus-ring-offset\);/,
    );
  });
});
