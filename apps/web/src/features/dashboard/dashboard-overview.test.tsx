import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview honest states", () => {
  it("renders the product navigation and the available local flows", () => {
    const html = renderToStaticMarkup(<DashboardOverview />);

    expect(html).toContain('aria-label="Navegação principal"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain('href="/health"');
    expect(html).toContain("Configurar perfil no onboarding");
    expect(html).toContain("Abrir carteira");
  });

  it("keeps unavailable financial information explicit instead of inventing metrics", () => {
    const html = renderToStaticMarkup(<DashboardOverview />);

    expect(html).toContain("Patrimônio total");
    expect(html).toContain("Dado indisponível");
    expect(html).toContain("Aporte do mês");
    expect(html).toContain("Ainda não calculado");
    expect(html).toContain("Reserva de emergência");
    expect(html).toContain("Sem dado persistido");
    expect(html).toContain("Carteira não disponível no dashboard");
    expect(html).toContain("Sem persistência nesta versão");

    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });

  it("explains why local data is not presented as dashboard state", () => {
    const html = renderToStaticMarkup(<DashboardOverview />);

    expect(html).toContain("cada estado vive somente na própria");
    expect(html).toContain("não recebe perfil, reserva, objetivos ou portfolio");
    expect(html).toContain("não é persistido nem");
    expect(html).toContain("Não persistidos");
    expect(html).toContain("Não persistida");
  });
});
