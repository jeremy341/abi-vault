import { createHmac, timingSafeEqual } from "node:crypto";
import { parseCustomDemoClasses, MAX_DEMO_CLASS_REGISTRY_LENGTH, type CustomDemoClass } from "./class-registry";

const MAX_SIGNED_COOKIE_LENGTH = 3800;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeSignedClassRegistry(classes: readonly CustomDemoClass[], secret: string) {
  const payload = Buffer.from(JSON.stringify(classes)).toString("base64url");
  const value = `${payload}.${signature(payload, secret)}`;
  if (value.length > MAX_SIGNED_COOKIE_LENGTH) throw new Error("The class list is full. Remove a class before adding another.");
  return value;
}

export function decodeSignedClassRegistry(value: string | undefined, secret: string | undefined) {
  if (!value || !secret || value.length > MAX_SIGNED_COOKIE_LENGTH) return [];
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return [];
  const payload = value.slice(0, separator);
  const supplied = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(signature(payload, secret));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return [];
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return decoded.length <= MAX_DEMO_CLASS_REGISTRY_LENGTH ? parseCustomDemoClasses(decoded) : [];
  } catch {
    return [];
  }
}
