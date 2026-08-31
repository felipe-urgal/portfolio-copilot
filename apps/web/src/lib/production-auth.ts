const GITHUB_PROVIDER = "github";
const GITHUB_ACCOUNT_ID_PATTERN = /^[1-9]\d*$/;

export type ProductionGitHubAccessInput = Readonly<{
  nodeEnv: string | undefined;
  allowedAccountId: string | undefined;
  provider: string | null | undefined;
  providerAccountId: string | null | undefined;
}>;

function normalizedAccountId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || !GITHUB_ACCOUNT_ID_PATTERN.test(normalized)) return null;
  return normalized;
}

export function isGitHubSignInAllowed(input: ProductionGitHubAccessInput): boolean {
  if (input.nodeEnv !== "production") return true;
  if (input.provider !== GITHUB_PROVIDER) return false;

  const allowedAccountId = normalizedAccountId(input.allowedAccountId);
  const providerAccountId = normalizedAccountId(input.providerAccountId);

  return allowedAccountId !== null && providerAccountId === allowedAccountId;
}
