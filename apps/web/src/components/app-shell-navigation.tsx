"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { APP_NAME } from "@portfolio-copilot/shared";

import { Button } from "./ui";
import styles from "./app-shell.module.css";

export type AppRoute = "/dashboard" | "/onboarding" | "/portfolio";

type NavigationItem = Readonly<{
  href: AppRoute;
  label: string;
}>;

const PRIMARY_NAVIGATION: ReadonlyArray<NavigationItem> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Carteira" },
  { href: "/onboarding", label: "Onboarding" },
];

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "U";

  const first = parts[0]?.[0] ?? "";
  const last = parts.at(-1)?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

function NavigationLinks({
  activeRoute,
  onNavigate,
}: Readonly<{ activeRoute: AppRoute; onNavigate?: (href: AppRoute) => void }>) {
  return (
    <nav className={styles.primaryNav} aria-label="Navegação principal">
      <span className={styles.navigationLabel}>Workspace</span>
      <div className={styles.navigationList}>
        {PRIMARY_NAVIGATION.map((item) => {
          const isActive = activeRoute === item.href;

          return (
            <Link
              className={isActive ? styles.navLinkActive : styles.navLink}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
            >
              <span className={styles.navMarker} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <Link className={styles.brand} href="/dashboard">
      <span className={styles.brandMark} aria-hidden="true">
        P
      </span>
      <span className={styles.brandText}>
        <strong>{APP_NAME}</strong>
        <small>Investment workspace</small>
      </span>
    </Link>
  );
}

function AccountArea({
  displayName,
  onNavigate,
}: Readonly<{ displayName?: string | undefined; onNavigate?: () => void }>) {
  return (
    <div className={styles.sidebarFooter}>
      <Link className={styles.utilityLink} href="/health" onClick={() => onNavigate?.()}>
        <span className={styles.utilityMarker} aria-hidden="true" />
        <span>Saúde da aplicação</span>
      </Link>

      {displayName === undefined ? null : (
        <Link className={styles.accountLink} href="/sign-out" onClick={() => onNavigate?.()}>
          <span className={styles.accountAvatar} aria-hidden="true">
            {getInitials(displayName)}
          </span>
          <span className={styles.accountCopy}>
            <strong>{displayName}</strong>
            <small>Sair da sessão</small>
          </span>
        </Link>
      )}
    </div>
  );
}

export function AppShellNavigation({
  activeRoute,
  accountDisplayName,
}: Readonly<{ activeRoute: AppRoute; accountDisplayName?: string | undefined }>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  const closeDrawer = useCallback((restoreFocus: boolean) => {
    restoreFocusRef.current = restoreFocus;
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false;
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
      return;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer(true);
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (drawer === null) return;

      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 961px)");

    function onViewportChange(event: MediaQueryListEvent): void {
      if (event.matches) {
        restoreFocusRef.current = false;
        setDrawerOpen(false);
      }
    }

    desktop.addEventListener("change", onViewportChange);
    return () => desktop.removeEventListener("change", onViewportChange);
  }, []);

  return (
    <>
      <aside className={styles.desktopSidebar} aria-label="Navegação do produto">
        <Brand />
        <NavigationLinks activeRoute={activeRoute} />
        <AccountArea displayName={accountDisplayName} />
      </aside>

      <header className={styles.mobileHeader}>
        <Brand />
        <Button
          ref={triggerRef}
          variant="secondary"
          size="md"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="app-navigation-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <span className={styles.menuGlyph} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className={styles.menuButtonLabel}>Menu</span>
        </Button>
      </header>

      {drawerOpen ? (
        <div className={styles.drawerLayer}>
          <div
            className={styles.drawerBackdrop}
            aria-hidden="true"
            onClick={() => closeDrawer(true)}
          />
          <aside
            ref={drawerRef}
            className={styles.drawer}
            id="app-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-navigation-title"
          >
            <div className={styles.drawerHeader}>
              <span id="app-navigation-title">Navegação</span>
              <Button ref={closeRef} variant="ghost" size="md" onClick={() => closeDrawer(true)}>
                Fechar
              </Button>
            </div>
            <div className={styles.drawerBody}>
              <NavigationLinks
                activeRoute={activeRoute}
                onNavigate={(href) => closeDrawer(href === activeRoute)}
              />
              <AccountArea displayName={accountDisplayName} onNavigate={() => closeDrawer(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
