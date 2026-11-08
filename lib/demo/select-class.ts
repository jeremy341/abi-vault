"use server";

import { cookies } from "next/headers";
import {
  DEMO_CLASSES,
  DEMO_CLASS_COOKIE,
  getCustomDemoClasses,
  isDemoClassId,
  saveCustomDemoClasses,
} from "@/lib/demo/classes";
import { isDemoData } from "@/lib/demo/mode";
import { MAX_CUSTOM_DEMO_CLASSES, MAX_DEMO_CLASS_NAME_LENGTH } from "@/lib/demo/class-registry";

export async function selectDemoClass(classId: string) {
  if (!isDemoData() || !(await isDemoClassId(classId))) return false;

  (await cookies()).set(DEMO_CLASS_COOKIE, classId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return true;
}

function normalizedName(name: string) {
  const value = name.trim();
  if (value.length < 2 || value.length > MAX_DEMO_CLASS_NAME_LENGTH) {
    throw new Error(`Class name must be between 2 and ${MAX_DEMO_CLASS_NAME_LENGTH} characters.`);
  }
  return value;
}

function validateRegistrySize(classes: readonly { id: string; name: string }[]) {
  const overrides = new Set(classes.filter((item) => DEMO_CLASSES.some((base) => base.id === item.id)).map((item) => item.id));
  const custom = classes.filter((item) => !DEMO_CLASSES.some((base) => base.id === item.id));
  if (custom.length + overrides.size > MAX_CUSTOM_DEMO_CLASSES) {
    throw new Error("The class list is full. Remove a class before adding another.");
  }
}

export async function createDemoClass(name: string) {
  if (!isDemoData()) throw new Error("Class creation is available in the demo only.");
  const normalized = normalizedName(name);
  const classes = await getCustomDemoClasses();
  const created = { id: `class-${crypto.randomUUID()}`, name: normalized };
  const updated = [...classes, created];
  validateRegistrySize(updated);
  await saveCustomDemoClasses(updated);
  (await cookies()).set(DEMO_CLASS_COOKIE, created.id, {
    path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365,
  });
  return { success: true as const, classId: created.id };
}

export async function renameDemoClass(classId: string, name: string) {
  if (!isDemoData()) throw new Error("Class management is available in the demo only.");
  if (!(await isDemoClassId(classId))) throw new Error("That class is not available in this browser.");
  const normalized = normalizedName(name);
  const classes = await getCustomDemoClasses();
  const existing = classes.find((item) => item.id === classId);
  const updated = existing
    ? classes.map((item) => item.id === classId ? { ...item, name: normalized } : item)
    : [...classes, { id: classId, name: normalized }];
  validateRegistrySize(updated);
  await saveCustomDemoClasses(updated);
  return { success: true as const };
}
