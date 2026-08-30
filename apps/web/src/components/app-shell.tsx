import type { ReactNode } from "react";

import type { AuthenticatedIdentity } from "@/lib/identity";

import { AppShellNavigation, type AppRoute } from "./app-shell-navigation";
import { Container } from "./ui";
import styles from "./app-shell.module.css";

export type AppShellProps = Readonly<{
  activeRoute: AppRoute;
  children: ReactNode;
  identity?: AuthenticatedIdentity | undefined;
}>;

export function AppShell({ activeRoute, children, identity }: AppShellProps) {
  return (
    <div className={styles.appShell}>
      <a className={styles.skipLink} href="#main-content">
        Pular para o conteúdo
      </a>

      <AppShellNavigation activeRoute={activeRoute} identity={identity} />

      <div className={styles.workspace}>
        <main className={styles.main} id="main-content" tabIndex={-1}>
          <Container size="wide">{children}</Container>
        </main>
      </div>
    </div>
  );
}
