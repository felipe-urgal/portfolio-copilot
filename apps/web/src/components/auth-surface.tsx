import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { APP_NAME } from "@portfolio-copilot/shared";

import { Alert, Container, LinkButton, Stack, Surface } from "./ui";
import { AuthSubmitButton } from "./auth-submit-button";
import styles from "./auth-surface.module.css";

type AuthFormAction = ComponentProps<"form">["action"];

export type AuthSurfaceProps = Readonly<{
  brandHref: string;
  title: string;
  description: string;
  children: ReactNode;
}>;

export function AuthSurface({ brandHref, title, description, children }: AuthSurfaceProps) {
  return (
    <main className={styles.page}>
      <Container size="narrow" className={styles.container}>
        <section aria-labelledby="auth-surface-title">
          <Surface tone="elevated" padding="lg" className={styles.surface}>
            <Stack space="2xl">
              <Link className={styles.brand} href={brandHref}>
                <span className={styles.brandMark} aria-hidden="true">
                  P
                </span>
                <span>{APP_NAME}</span>
              </Link>

              <div className={styles.heading}>
                <h1 className={styles.title} id="auth-surface-title">
                  {title}
                </h1>
                <p className={styles.description}>{description}</p>
              </div>

              {children}
            </Stack>
          </Surface>
        </section>
      </Container>
    </main>
  );
}

export function AuthDisclosure({
  summary,
  children,
}: Readonly<{ summary: string; children: ReactNode }>) {
  return (
    <details className={styles.disclosure}>
      <summary>{summary}</summary>
      <div className={styles.disclosureBody}>{children}</div>
    </details>
  );
}

export function SignInAuthView({
  action,
  hasError,
  isReentry,
}: Readonly<{ action: AuthFormAction; hasError: boolean; isReentry: boolean }>) {
  const description = isReentry
    ? "Sua sessão precisa estar ativa para acessar essa área. Entre com GitHub para continuar com segurança."
    : "Use sua conta GitHub para acessar seu workspace financeiro.";

  return (
    <AuthSurface brandHref="/" title="Entre para continuar" description={description}>
      <Stack space="lg">
        {hasError ? (
          <Alert tone="danger" title="Não foi possível entrar">
            Tente novamente com GitHub. Nenhum detalhe sensível da falha é exibido nesta tela.
          </Alert>
        ) : null}

        <form className={styles.form} action={action}>
          <AuthSubmitButton>Entrar com GitHub</AuthSubmitButton>
        </form>

        <AuthDisclosure summary="Privacidade e segurança">
          <ul className={styles.disclosureList}>
            <li>O Portfolio Copilot não recebe sua senha do GitHub.</li>
            <li>Seu perfil financeiro local permanece separado da autenticação.</li>
            <li>Sua sessão pode exigir uma nova autenticação após expirar.</li>
          </ul>
        </AuthDisclosure>
      </Stack>
    </AuthSurface>
  );
}

export function SignOutAuthView({
  action,
  displayName,
}: Readonly<{ action: AuthFormAction; displayName: string }>) {
  return (
    <AuthSurface
      brandHref="/dashboard"
      title="Encerrar sessão?"
      description="Isso encerra somente sua sessão autenticada neste navegador."
    >
      <Stack space="lg">
        <p className={styles.accountContext}>
          Sessão ativa para <strong>{displayName}</strong>
        </p>

        <div className={styles.actions}>
          <form className={styles.form} action={action}>
            <AuthSubmitButton>Encerrar sessão</AuthSubmitButton>
          </form>
          <LinkButton className={styles.fullAction} href="/dashboard" variant="secondary" size="lg">
            Continuar no produto
          </LinkButton>
        </div>

        <AuthDisclosure summary="O que acontece ao sair?">
          <ul className={styles.disclosureList}>
            <li>A sessão autenticada neste navegador é encerrada.</li>
            <li>Seu perfil financeiro salvo neste dispositivo não é apagado.</li>
          </ul>
        </AuthDisclosure>
      </Stack>
    </AuthSurface>
  );
}
