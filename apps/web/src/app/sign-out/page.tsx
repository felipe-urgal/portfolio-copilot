import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_NAME } from "@portfolio-copilot/shared";

import { signOut } from "@/auth";
import styles from "@/components/auth-surface.module.css";
import { getAuthenticatedIdentity } from "@/lib/identity-server";

export const metadata: Metadata = {
  title: `Sair | ${APP_NAME}`,
  description: "Encerre a sessão autenticada sem alterar o perfil financeiro salvo no dispositivo.",
};

export default async function SignOutPage() {
  const identity = await getAuthenticatedIdentity();

  if (identity === null) redirect("/sign-in");

  async function endSession() {
    "use server";

    await signOut({ redirectTo: "/sign-in" });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="sign-out-title">
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/dashboard">
            {APP_NAME}
          </Link>
          <span className={styles.securityLabel}>
            <span className={styles.securityDot} aria-hidden="true" />
            Sessão autenticada
          </span>
        </div>

        <p className={styles.eyebrow}>Sessão</p>
        <h1 className={styles.title} id="sign-out-title">
          Encerrar sessão?
        </h1>
        <p className={styles.description}>
          Isso encerra somente sua sessão autenticada neste navegador.
        </p>

        <div className={styles.identitySummary} aria-label="Identidade autenticada">
          <strong>{identity.displayName}</strong>
          {identity.email === null ? null : <span>{identity.email}</span>}
        </div>

        <div className={styles.notice}>
          <strong>Seus dados locais não são apagados ao sair.</strong>
          O perfil financeiro salvo neste dispositivo continua sob a ação explícita de remoção já
          existente no onboarding.
        </div>

        <div className={styles.actions}>
          <form action={endSession}>
            <button className={styles.primaryButton} type="submit">
              Encerrar sessão
            </button>
          </form>
          <Link className={styles.secondaryLink} href="/dashboard">
            Continuar no produto
          </Link>
        </div>
      </section>
    </main>
  );
}
