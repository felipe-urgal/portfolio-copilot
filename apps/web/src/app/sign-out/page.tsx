import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP_NAME } from "@portfolio-copilot/shared";

import { signOut } from "@/auth";
import { SignOutAuthView } from "@/components/auth-surface";
import { getAuthenticatedIdentity } from "@/lib/identity-server";

export const metadata: Metadata = {
  title: `Sair | ${APP_NAME}`,
  description: "Encerre sua sessão autenticada sem alterar dados financeiros locais.",
};

export default async function SignOutPage() {
  const identity = await getAuthenticatedIdentity();

  if (identity === null) redirect("/sign-in");

  async function endSession() {
    "use server";

    await signOut({ redirectTo: "/sign-in" });
  }

  return <SignOutAuthView action={endSession} displayName={identity.displayName} />;
}
