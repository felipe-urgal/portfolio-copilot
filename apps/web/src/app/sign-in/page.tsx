import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_NAME } from "@portfolio-copilot/shared";

import { auth, signIn } from "@/auth";
import styles from "@/components/auth-surface.module.css";
import { identityFromSession, resolveSafeCallbackPath } from "@/lib/identity";

type SignInPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const metadata: Metadata = {
  title: `Entrar | ${APP_NAME}`,
  description: "Entre com uma identidade segura para acessar as superfícies protegidas do MVP.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackPath(params.callbackUrl);
  const identity = identityFromSession(await auth());

  if (identity !== null) redirect(callbackUrl);

  async function continueWithGitHub() {
    "use server";

    await signIn("github", { redirectTo: callbackUrl });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="sign-in-title">
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/">
            {APP_NAME}
          </Link>
          <span className={styles.securityLabel}>
            <span className={styles.securityDot} aria-hidden="true" />
            Sessão protegida
          </span>
        </div>

        <p className={styles.eyebrow}>Identidade</p>
        <h1 className={styles.title} id="sign-in-title">
          Entre para continuar
        </h1>
        <p className={styles.description}>
          O acesso ao produto usa autenticação externa. O Portfolio Copilot não recebe nem armazena
          sua senha do GitHub.
        </p>

        {params.error === undefined ? null : (
          <div className={styles.errorNotice} role="alert">
            <strong>Não foi possível concluir a autenticação.</strong>
            Tente entrar novamente. Nenhum detalhe sensível da falha é exibido nesta tela.
          </div>
        )}

        <div className={styles.notice}>
          <strong>Seu perfil financeiro local continua separado.</strong>
          Entrar não envia, copia nem associa automaticamente à conta o perfil salvo neste
          dispositivo.
        </div>

        <div className={styles.actions}>
          <form action={continueWithGitHub}>
            <button className={styles.primaryButton} type="submit">
              <span className={styles.providerMark} aria-hidden="true">
                GH
              </span>
              Entrar com GitHub
            </button>
          </form>
          <Link className={styles.secondaryLink} href="/health">
            Ver saúde da aplicação
          </Link>
        </div>

        <p className={styles.footerCopy}>
          A sessão expira e pode exigir nova autenticação. Tokens e cookies não são exibidos pela
          interface.
        </p>
      </section>
    </main>
  );
}
