import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  isKnownDemoClassId,
  resolveDemoClasses,
  type CustomDemoClass,
  type DemoClass,
} from "@/lib/demo/class-registry";
import { decodeSignedClassRegistry, encodeSignedClassRegistry } from "@/lib/demo/signed-class-registry";

export const DEMO_CLASS_COOKIE = "abi-demo-class";
export const DEMO_CLASS_REGISTRY_COOKIE = "abi-demo-class-registry";

export const DEMO_CLASSES = [
  { id: "class-2026", name: "Class of 2026" },
  { id: "class-2027", name: "Class of 2027" },
] as const satisfies readonly DemoClass[];

export type DemoClassId = string;

const ephemeralLocalSecret = randomBytes(32).toString("hex");

function signingSecret() {
  return process.env.DEMO_CLASS_SIGNING_SECRET || process.env.DEMO_SUPABASE_SERVICE_ROLE_KEY || process.env.APP_ENCRYPTION_KEY || (process.env.VERCEL === "1" ? undefined : ephemeralLocalSecret);
}

function decodeRegistry(cookieValue: string | undefined): CustomDemoClass[] {
  return decodeSignedClassRegistry(cookieValue, signingSecret());
}

async function customClassesFromCookie() {
  const store = await cookies();
  return decodeRegistry(store.get(DEMO_CLASS_REGISTRY_COOKIE)?.value);
}

export async function getDemoClasses(): Promise<DemoClass[]> {
  return resolveDemoClasses(DEMO_CLASSES, await customClassesFromCookie());
}

export async function saveCustomDemoClasses(classes: readonly CustomDemoClass[]) {
  const secret = signingSecret();
  if (!secret) throw new Error("Class management needs DEMO_CLASS_SIGNING_SECRET configured on the server.");
  const value = encodeSignedClassRegistry(classes, secret);
  (await cookies()).set(DEMO_CLASS_REGISTRY_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getCustomDemoClasses() {
  return customClassesFromCookie();
}

export async function isDemoClassId(value: string | undefined): Promise<boolean> {
  return isKnownDemoClassId(value, DEMO_CLASSES, await customClassesFromCookie());
}

export async function currentDemoClassId(): Promise<DemoClassId> {
  try {
    const store = await cookies();
    const value = store.get(DEMO_CLASS_COOKIE)?.value;
    if (isKnownDemoClassId(value, DEMO_CLASSES, await customClassesFromCookie())) return value;
    return DEMO_CLASSES[0].id;
  } catch {
    return DEMO_CLASSES[0].id;
  }
}
