import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { APP_NAME } from "@portfolio-copilot/shared";

import HealthPage, { metadata } from "./page";

describe("HealthPage", () => {
  it("exposes a descriptive document title for the operational route", () => {
    expect(metadata.title).toBe(`Status da aplicação | ${APP_NAME}`);
    expect(metadata.description).toContain("estado operacional básico");
  });

  it("uses the canonical operational feedback hierarchy without legacy shell classes", () => {
    const html = renderToStaticMarkup(<HealthPage />);

    expect(html).toContain("Status da aplicação");
    expect(html).toContain("Aplicação respondendo");
    expect(html).toContain("Verificações automáticas de dependências");
    expect(html).toContain("<dl");
    expect(html).not.toContain('class="shell"');
    expect(html).not.toContain('class="card"');
    expect(html).not.toContain("eyebrow");
  });
});
