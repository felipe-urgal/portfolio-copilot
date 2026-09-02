import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReasonCodeList } from "./reason-code-list";

describe("ReasonCodeList", () => {
  it("keeps human explanation ahead of the auditable code", () => {
    const html = renderToStaticMarkup(
      <ReasonCodeList
        reasons={[
          {
            code: "HARD_CONCENTRATION_LIMIT_APPLIED",
            title: "Limite rígido aplicado",
            description: "O novo aporte foi restringido pelo limite configurado.",
          },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Motivos estruturados"');
    expect(html).toContain("Limite rígido aplicado");
    expect(html).toContain("HARD_CONCENTRATION_LIMIT_APPLIED");
    expect(html.indexOf("Limite rígido aplicado")).toBeLessThan(
      html.indexOf("HARD_CONCENTRATION_LIMIT_APPLIED"),
    );
  });

  it("renders an explicit empty explanation without inventing a cause", () => {
    const html = renderToStaticMarkup(
      <ReasonCodeList reasons={[]} emptyMessage="Nenhuma causa adicional foi informada." />,
    );

    expect(html).toContain("Nenhuma causa adicional foi informada.");
    expect(html).not.toContain("<ul");
  });
});
