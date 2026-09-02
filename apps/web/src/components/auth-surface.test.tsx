import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SignInAuthView, SignOutAuthView } from "./auth-surface";

const AUTH_SOURCE = readFileSync(new URL("./auth-surface.tsx", import.meta.url), "utf8");
const AUTH_CSS = readFileSync(new URL("./auth-surface.module.css", import.meta.url), "utf8");

function renderSignIn(hasError = false, isReentry = false): string {
  return renderToStaticMarkup(
    <SignInAuthView action="/auth/github" hasError={hasError} isReentry={isReentry} />,
  );
}

describe("focused auth surface", () => {
  it("keeps sign-in focused on one GitHub action", () => {
    const html = renderSignIn();

    expect(html).toContain("Entre para continuar");
    expect(html).toContain("Entrar com GitHub");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('href="/health"');
    expect(html).not.toContain("Sessão protegida");
    expect(html).not.toContain(">Identidade<");
  });

  it("keeps the focused-auth brand on the canonical touch target without enlarging its glyph", () => {
    expect(AUTH_CSS).toMatch(/\.brand\s*\{[\s\S]*?min-height: var\(--touch-target-min\);/);
    expect(AUTH_CSS).toMatch(
      /\.brandMark\s*\{[\s\S]*?width: var\(--control-height-sm\);[\s\S]*?height: var\(--control-height-sm\);/,
    );
  });

  it("keeps trust information in the canonical progressive disclosure", () => {
    const html = renderSignIn();

    expect(html).toContain("<details");
    expect(html).toContain("Privacidade e segurança");
    expect(html).toContain("não recebe sua senha do GitHub");
    expect(html).toContain("perfil financeiro local permanece separado");
    expect(html).toContain("nova autenticação após expirar");
    expect(html).not.toContain("<details open");
    expect(AUTH_SOURCE).toContain("<Disclosure");
    expect(AUTH_SOURCE).not.toContain("<details");
    expect(AUTH_SOURCE).not.toContain("AuthDisclosure");
    expect(AUTH_CSS).not.toContain(".disclosure summary");
  });

  it("renders safe error and re-entry states without internal details", () => {
    const html = renderSignIn(true, true);

    expect(html).toContain("Sua sessão precisa estar ativa para acessar essa área");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Não foi possível entrar");
    expect(html).toContain("Nenhum detalhe sensível da falha é exibido");
    expect(html).not.toContain("token");
    expect(html).not.toContain("cookie");
  });

  it("keeps sign-out calm, explicit and limited to useful account context", () => {
    const html = renderToStaticMarkup(
      <SignOutAuthView action="/auth/sign-out" displayName="Felipe Urgal" />,
    );

    expect(html).toContain("Encerrar sessão?");
    expect(html).toContain("Sessão ativa para <strong>Felipe Urgal</strong>");
    expect(html).toContain("Encerrar sessão");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Continuar no produto");
    expect(html).toContain("O que acontece ao sair?");
    expect(html).not.toContain("@example.com");
  });

  it("uses the R2 token system instead of a parallel auth palette", () => {
    expect(AUTH_CSS).toContain("var(--color-canvas)");
    expect(AUTH_CSS).toContain("var(--color-text-primary)");
    expect(AUTH_CSS).toContain("var(--focus-ring-width)");
    expect(AUTH_CSS).toContain("color-mix(");
    expect(AUTH_CSS).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(AUTH_CSS).not.toMatch(/rgba?\(/i);
    expect(AUTH_CSS).not.toContain(".primaryButton");
  });
});
