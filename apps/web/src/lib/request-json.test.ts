import { describe, expect, it } from "vitest";

import { readJsonBodyWithLimit, RequestPayloadTooLargeError } from "./request-json";

describe("readJsonBodyWithLimit", () => {
  it("parses a JSON body below the byte limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
    });

    await expect(readJsonBodyWithLimit(request, 1024)).resolves.toEqual({ ok: true });
  });

  it("rejects a declared payload larger than the limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: "{}",
      headers: { "content-length": "2048" },
    });

    await expect(readJsonBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(
      RequestPayloadTooLargeError,
    );
  });

  it("enforces the stream limit even when content-length is absent", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(2048) }),
    });

    await expect(readJsonBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(
      RequestPayloadTooLargeError,
    );
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: "{not-json}",
    });

    await expect(readJsonBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(SyntaxError);
  });
});
