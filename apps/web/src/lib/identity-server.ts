import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { identityFromSession, type AuthenticatedIdentity } from "@/lib/identity";

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  return identityFromSession(await auth());
}

export async function requireAuthenticatedIdentity(): Promise<AuthenticatedIdentity> {
  const identity = await getAuthenticatedIdentity();

  if (identity === null) redirect("/sign-in");

  return identity;
}
