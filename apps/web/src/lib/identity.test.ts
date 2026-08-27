import { describe, expect, it } from "vitest";

import {
  createCanonicalIdentitySubject,
  identityFromSession,
  isProtectedProductPath,
  resolveSafeCallbackPath,
} from "./identity";

describe("identity boundary", () => {
  it("creates a canonical authenticated subject without reusing financial domain ids", () => {
    const financialProfileId = "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298";
    const subject = createCanonicalIdentitySubject("github", "38505458");

    expect(subject).toBe("github:38505458");
    expect(subject).not.toBe(financialProfileId);
  });

  it("rejects missing or invalid session identity instead of treating session existence as auth", () => {
    expect(identityFromSession(null)).toBeNull();
    expect(identityFromSession({ user: null })).toBeNull();
    expect(identityFromSession({ user: { id: "" } })).toBeNull();
    expect(identityFromSession({ user: { id: "   ", name: "Felipe" } })).toBeNull();
  });

  it("exposes only minimal shell identity and keeps the internal subject separate from display name", () => {
    expect(
      identityFromSession({
        user: {
          id: "github:38505458",
          name: "Felipe",
          email: "felipe@example.com",
          image: "https://avatars.example/felipe.png",
        },
      }),
    ).toEqual({
      subject: "github:38505458",
      displayName: "Felipe",
      email: "felipe@example.com",
      avatarUrl: "https://avatars.example/felipe.png",
    });
  });

  it("protects only product surfaces and leaves operational health public", () => {
    expect(isProtectedProductPath("/dashboard")).toBe(true);
    expect(isProtectedProductPath("/portfolio/assets")).toBe(true);
    expect(isProtectedProductPath("/onboarding")).toBe(true);
    expect(isProtectedProductPath("/health")).toBe(false);
    expect(isProtectedProductPath("/sign-in")).toBe(false);
  });

  it("accepts only internal protected callback paths", () => {
    expect(resolveSafeCallbackPath("/portfolio?tab=ledger")).toBe("/portfolio?tab=ledger");
    expect(resolveSafeCallbackPath("https://attacker.example/phishing")).toBe("/dashboard");
    expect(resolveSafeCallbackPath("//attacker.example/phishing")).toBe("/dashboard");
    expect(resolveSafeCallbackPath("/health")).toBe("/dashboard");
  });
});
