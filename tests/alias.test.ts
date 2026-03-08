import { describe, it, expect } from "vitest";
import { generateAlias, generateAvatarColor } from "../server/alias";

describe("generateAlias", () => {
  it("returns a two-word string", () => {
    const alias = generateAlias();
    const parts = alias.split(" ");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("generates different aliases across multiple calls", () => {
    const aliases = new Set(Array.from({ length: 50 }, () => generateAlias()));
    // With 35 adjectives * 35 nouns = 1225 combos, 50 calls should produce at least a few unique
    expect(aliases.size).toBeGreaterThan(1);
  });
});

describe("generateAvatarColor", () => {
  it("returns a valid hex color", () => {
    const color = generateAvatarColor();
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
