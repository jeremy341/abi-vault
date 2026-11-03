"use server";

import { cookies } from "next/headers";
import { DEMO_CLASS_COOKIE, isDemoClassId } from "@/lib/demo/classes";

export async function selectDemoClass(classId: string) {
  if (!isDemoClassId(classId)) return false;

  (await cookies()).set(DEMO_CLASS_COOKIE, classId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return true;
}
