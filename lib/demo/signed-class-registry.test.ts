import { describe, expect, it } from "vitest";
import { decodeSignedClassRegistry, encodeSignedClassRegistry } from "./signed-class-registry";

describe("signed demo class registry", () => {
  it("round trips class names and IDs with a server secret", () => {
    const classes = [{ id: "class-00000000-0000-4000-8000-000000000001", name: "My class" }];
    const cookie = encodeSignedClassRegistry(classes, "test-secret");
    expect(decodeSignedClassRegistry(cookie, "test-secret")).toEqual(classes);
  });

  it("rejects altered class data and cookies signed with another secret", () => {
    const classes = [{ id: "class-00000000-0000-4000-8000-000000000001", name: "My class" }];
    const cookie = encodeSignedClassRegistry(classes, "test-secret");
    const [payload, signature] = cookie.split(".");
    const changed = `${Buffer.from(JSON.stringify([{ ...classes[0], id: "class-00000000-0000-4000-8000-000000000099" }])).toString("base64url")}.${signature}`;
    expect(decodeSignedClassRegistry(changed, "test-secret")).toEqual([]);
    expect(decodeSignedClassRegistry(`${payload}.${signature}`, "another-secret")).toEqual([]);
  });

  it("rejects forged or oversized cookies", () => {
    expect(decodeSignedClassRegistry("not-signed", "test-secret")).toEqual([]);
    expect(decodeSignedClassRegistry("x".repeat(5000), "test-secret")).toEqual([]);
    expect(decodeSignedClassRegistry(undefined, undefined)).toEqual([]);
  });
});
