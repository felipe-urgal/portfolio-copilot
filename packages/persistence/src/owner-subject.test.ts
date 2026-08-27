import { describe, expect, it } from "vitest";

import { InvalidOwnerSubjectError, OwnerSubject } from "./owner-subject";

describe("OwnerSubject", () => {
  it("normalizes the canonical authenticated subject", () => {
    expect(OwnerSubject("  github:12345  ")).toBe("github:12345");
  });

  it("rejects absent and unsafe subjects without echoing them", () => {
    for (const candidate of ["", "   ", "github:12\n34", "x".repeat(321)]) {
      expect(() => OwnerSubject(candidate)).toThrowError(InvalidOwnerSubjectError);
    }
  });
});
