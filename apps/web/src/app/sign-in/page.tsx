import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_NAME } from "@portfolio-copilot/shared";

import { auth, signIn } from "@/auth";
import { SignInAuthView } from "@/components/auth-surface";
import { identityFromSession, resolveSafeCallbackPath } from "@/lib/identity";

type SignInPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const metadata: Metadata = {
  title: `Entrar | ${APP_NAME}`,
  description: "Entre com GitHub para acessar seu workspace financeiro.",
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
    <SignInAuthView
      action={continueWithGitHub}
      hasError={params.error !== undefined}
      isReentry={params.callbackUrl !== undefined}
    />
  );
}
