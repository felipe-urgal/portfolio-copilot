import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "./app-shell";

const IDENTITY = {
  subject: "github:38505458",
  displayName: "Felipe Urgal",
  email: "felipe@example.com",
  avatarUrl: null,
} as const;

const SHELL_CSS = readFileSync(new URL("./app-shell.module.css", import.meta.url), "utf8");
const NAVIGATION_SOURCE = readFileSync(
  new URL("./app-shell-navigation.tsx", import.meta.url),
  "utf8",
);
const MOBILE_MENU_BUTTON = /variant="secondary"\s+size="md"\s+aria-haspopup="dialog"/;
const DRAWER_CLOSE_BUTTON = /variant="ghost"\s+size="md"\s+onClick=\{\(\) => closeDrawer\(true\)\}/;
const BRAND_TOUCH_TARGET = /\.brand\s*\{[\s\S]*?min-height:\s*var\(--touch-target-min\);/;
const HEALTH_MARKER = /\.utilityMarker\s*\{([\s\S]*?)\}/;

function renderShell(activeRoute: "/dashboard" | "/portfolio" | "/onboarding" = "/dashboard") {
  return renderToStaticMarkup(
    <AppShell activeRoute={activeRoute} identity={IDENTITY}>
      <h1>Conteúdo protegido</h1>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders only real product routes and marks the active route", () => {
    const html = renderShell("/portfolio");

    expect(html).toContain('aria-label="Navegação principal"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain('href="/health"');
    expect(html).toContain('href="/sign-out"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('href="/assistant"');
    expect(html).not.toContain('href="/reports"');
    expect(html).not.toContain('href="/theses"');
  });

  it("keeps the health utility visually neutral until the real health page is opened", () => {
    const marker = SHELL_CSS.match(HEALTH_MARKER)?.[1] ?? "";

    expect(marker).toContain("var(--color-border-strong)");
    expect(marker).toContain("var(--color-surface-subtle)");
    expect(marker).not.toContain("--color-success");
  });

  it("provides skip navigation, landmarks and a closed mobile drawer trigger", () => {
    const html = renderShell();

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-label="Navegação do produto"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="app-navigation-drawer"');
  });

  it("derives the account link name from its visible sign-out action", () => {
    const html = renderShell();

    expect(html).toContain("Felipe Urgal");
    expect(html).toContain("FU");
    expect(html).toContain("Sair da sessão");
    expect(NAVIGATION_SOURCE).not.toContain("aria-label={`${displayName}");
    expect(html).not.toContain("Abrir opções para sair");
    expect(html).not.toContain(IDENTITY.subject);
  });

  it("defines desktop sidebar, responsive drawer and reduced-motion contracts", () => {
    expect(SHELL_CSS).toContain(".desktopSidebar");
    expect(SHELL_CSS).toContain("@media (max-width: 960px)");
    expect(SHELL_CSS).toContain(".drawerLayer");
    expect(SHELL_CSS).toContain(".drawerBackdrop");
    expect(SHELL_CSS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(SHELL_CSS).toContain("var(--color-focus-ring)");
    expect(SHELL_CSS).toContain("var(--z-modal)");
  });

  it("keeps focus and button styling on the canonical R2 contracts", () => {
    expect(SHELL_CSS).toContain(".main:focus-visible");
    expect(SHELL_CSS).toContain("border-color: var(--color-border-strong)");
    expect(SHELL_CSS).not.toContain(".menuButton {");
    expect(SHELL_CSS).not.toContain(".drawerClose {");
  });

  it("keeps mobile navigation controls on the canonical 44px touch-target size", () => {
    expect(NAVIGATION_SOURCE).toMatch(MOBILE_MENU_BUTTON);
    expect(NAVIGATION_SOURCE).toMatch(DRAWER_CLOSE_BUTTON);
    expect(SHELL_CSS).toMatch(BRAND_TOUCH_TARGET);
  });
});
