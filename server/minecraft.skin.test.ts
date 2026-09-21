import { describe, expect, it } from "vitest";
import { normalizeUuid } from "./routers";

describe("minecraft skin integration", () => {
  it("normalizes compact Mojang UUIDs", () => {
    expect(normalizeUuid("8667ba71b85a4004af54457a9734eed7")).toBe("8667ba71-b85a-4004-af54-457a9734eed7");
  });

  it("keeps hyphenated UUIDs stable", () => {
    expect(normalizeUuid("8667ba71-b85a-4004-af54-457a9734eed7")).toBe("8667ba71-b85a-4004-af54-457a9734eed7");
  });

  it("rejects malformed UUIDs", () => {
    expect(() => normalizeUuid("not-a-minecraft-user")).toThrow();
  });
});
