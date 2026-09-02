import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HealthPage from "./page";

describe("HealthPage", () => {
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
