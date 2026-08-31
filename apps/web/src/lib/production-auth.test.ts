import { describe, expect, it } from "vitest";

import { isGitHubSignInAllowed } from "./production-auth";

describe("isGitHubSignInAllowed", () => {
  it("keeps local development open without a production allowlist", () => {
    expect(
      isGitHubSignInAllowed({
        nodeEnv: "development",
        allowedAccountId: undefined,
        provider: "github",
        providerAccountId: "123",
      }),
    ).toBe(true);
  });

  it("allows only the configured GitHub account in production", () => {
    expect(
      isGitHubSignInAllowed({
        nodeEnv: "production",
        allowedAccountId: "38505458",
        provider: "github",
        providerAccountId: "38505458",
      }),
    ).toBe(true);

    expect(
      isGitHubSignInAllowed({
        nodeEnv: "production",
        allowedAccountId: "38505458",
        provider: "github",
        providerAccountId: "123456",
      }),
    ).toBe(false);
  });

  it("fails closed when the production allowlist is missing or malformed", () => {
    for (const allowedAccountId of [undefined, "", "github:38505458", "38_505_458"]) {
      expect(
        isGitHubSignInAllowed({
          nodeEnv: "production",
          allowedAccountId,
          provider: "github",
          providerAccountId: "38505458",
        }),
      ).toBe(false);
    }
  });

  it("fails closed for unexpected providers or malformed provider account ids", () => {
    expect(
      isGitHubSignInAllowed({
        nodeEnv: "production",
        allowedAccountId: "38505458",
        provider: "google",
        providerAccountId: "38505458",
      }),
    ).toBe(false);

    expect(
      isGitHubSignInAllowed({
        nodeEnv: "production",
        allowedAccountId: "38505458",
        provider: "github",
        providerAccountId: "not-a-number",
      }),
    ).toBe(false);
  });
});
