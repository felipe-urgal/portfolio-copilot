import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@portfolio-copilot/shared";

import type { AuthenticatedIdentity } from "@/lib/identity";

import styles from "./product-shell.module.css";

type ProductRoute = "/dashboard" | "/onboarding" | "/portfolio";

type ProductShellProps = Readonly<{
  activeRoute: ProductRoute;
  children: ReactNode;
  identity?: AuthenticatedIdentity;
}>;

const PRIMARY_NAVIGATION: ReadonlyArray<Readonly<{ href: ProductRoute; label: string }>> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Carteira" },
  { href: "/onboarding", label: "Onboarding" },
];

export function ProductShell({ activeRoute, children, identity }: ProductShellProps) {
  return (
    <div className={styles.pageShell}>
      <a className={styles.skipLink} href="#main-content">
        Pular para o conteúdo
      </a>

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/dashboard">
            {APP_NAME}
          </Link>

          <nav className={styles.primaryNav} aria-label="Navegação principal">
            {PRIMARY_NAVIGATION.map((item) => (
              <Link
                className={activeRoute === item.href ? styles.navLinkActive : styles.navLink}
                href={item.href}
                aria-current={activeRoute === item.href ? "page" : undefined}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.utilityArea}>
            <Link className={styles.utilityLink} href="/health">
              Saúde
            </Link>
            {identity === undefined ? null : (
              <Link
                className={styles.accountLink}
                href="/sign-out"
                aria-label={`Sessão autenticada como ${identity.displayName}. Abrir opções para sair.`}
              >
                <span className={styles.accountStatus} aria-hidden="true" />
                <span className={styles.accountName}>{identity.displayName}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
