import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductShell } from "./product-shell";

const IDENTITY = {
  subject: "github:38505458",
  displayName: "Felipe",
  email: "felipe@example.com",
  avatarUrl: null,
} as const;

describe("ProductShell authenticated state", () => {
  it("shows a minimal authenticated state without exposing the canonical internal subject", () => {
    const html = renderToStaticMarkup(
      <ProductShell activeRoute="/dashboard" identity={IDENTITY}>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(html).toContain("Felipe");
    expect(html).toContain('href="/sign-out"');
    expect(html).toContain("Sessão autenticada como Felipe");
    expect(html).not.toContain(IDENTITY.subject);
  });
});
