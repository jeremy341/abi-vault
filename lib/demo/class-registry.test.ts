import { describe, expect, it } from "vitest";
import { isKnownDemoClassId, parseCustomDemoClasses, resolveDemoClasses } from "./class-registry";

const defaults = [
  { id: "class-2026", name: "Class of 2026" },
  { id: "class-2027", name: "Class of 2027" },
] as const;

describe("demo class registry", () => {
  it("accepts valid custom class metadata and rejects malformed IDs or names", () => {
    expect(parseCustomDemoClasses(JSON.stringify([
      { id: "class-00000000-0000-4000-8000-000000000001", name: "My class" },
      { id: "other-id", name: "Forged" },
      { id: "class-00000000-0000-4000-8000-000000000002", name: "x" },
    ]))).toEqual([{ id: "class-00000000-0000-4000-8000-000000000001", name: "My class" }]);
  });

  it("accepts per-browser labels for built-in class IDs", () => {
    expect(parseCustomDemoClasses(JSON.stringify([
      { id: "class-2026", name: "My graduating class" },
    ]))).toEqual([{ id: "class-2026", name: "My graduating class" }]);
  });

  it("overrides built-in names and appends custom classes", () => {
    expect(resolveDemoClasses(defaults, [
      { id: "class-2026", name: "Renamed class" },
      { id: "class-00000000-0000-4000-8000-000000000001", name: "My class" },
    ])).toEqual([
      { id: "class-2026", name: "Renamed class" },
      { id: "class-2027", name: "Class of 2027" },
      { id: "class-00000000-0000-4000-8000-000000000001", name: "My class" },
    ]);
  });

  it("only recognizes built-in IDs and custom IDs in the validated registry", () => {
    const custom = [{ id: "class-00000000-0000-4000-8000-000000000001", name: "My class" }];
    expect(isKnownDemoClassId("class-2026", defaults, custom)).toBe(true);
    expect(isKnownDemoClassId(custom[0].id, defaults, custom)).toBe(true);
    expect(isKnownDemoClassId("class-00000000-0000-4000-8000-000000000099", defaults, custom)).toBe(false);
  });

  it("rejects oversized registry input", () => {
    expect(parseCustomDemoClasses("x".repeat(4000))).toEqual([]);
  });
});
