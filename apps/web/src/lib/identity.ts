export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

const PROTECTED_PRODUCT_ROOTS = ["/dashboard", "/portfolio", "/onboarding"] as const;

type SessionIdentitySource = Readonly<{
  user?:
    | Readonly<{
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }>
    | null;
}>;

export type AuthenticatedIdentity = Readonly<{
  subject: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}>;

function normalizedText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function createCanonicalIdentitySubject(
  provider: string,
  providerAccountId: string,
): string | null {
  const normalizedProvider = normalizedText(provider);
  const normalizedAccountId = normalizedText(providerAccountId);

  if (normalizedProvider === null || normalizedAccountId === null) return null;

  return `${normalizedProvider}:${normalizedAccountId}`;
}

export function identityFromSession(session: SessionIdentitySource | null): AuthenticatedIdentity | null {
  const subject = normalizedText(session?.user?.id);
  if (subject === null) return null;

  const name = normalizedText(session?.user?.name);
  const email = normalizedText(session?.user?.email);

  return {
    subject,
    displayName: name ?? email ?? "Usuário autenticado",
    email,
    avatarUrl: normalizedText(session?.user?.image),
  };
}

export function isProtectedProductPath(pathname: string): boolean {
  return PROTECTED_PRODUCT_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export function resolveSafeCallbackPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return DEFAULT_AUTHENTICATED_ROUTE;

  try {
    const base = new URL("https://portfolio-copilot.invalid");
    const resolved = new URL(candidate, base);

    if (resolved.origin !== base.origin || !isProtectedProductPath(resolved.pathname)) {
      return DEFAULT_AUTHENTICATED_ROUTE;
    }

    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
}
