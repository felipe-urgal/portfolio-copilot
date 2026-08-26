import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@portfolio-copilot/shared";

import styles from "./product-shell.module.css";

type ProductRoute = "/dashboard" | "/onboarding";

type ProductShellProps = Readonly<{
  activeRoute: ProductRoute;
  children: ReactNode;
}>;

const PRIMARY_NAVIGATION: ReadonlyArray<Readonly<{ href: ProductRoute; label: string }>> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
];

export function ProductShell({ activeRoute, children }: ProductShellProps) {
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

          <Link className={styles.utilityLink} href="/health">
            Saúde da aplicação
          </Link>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
