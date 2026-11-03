import { cookies } from "next/headers";

export const DEMO_CLASS_COOKIE = "abi-demo-class";

export const DEMO_CLASSES = [
  { id: "class-2026", name: "Class of 2026" },
  { id: "class-2027", name: "Class of 2027" },
] as const;

export type DemoClassId = (typeof DEMO_CLASSES)[number]["id"];

export function isDemoClassId(value: string | undefined): value is DemoClassId {
  return DEMO_CLASSES.some((demoClass) => demoClass.id === value);
}

export async function currentDemoClassId(): Promise<DemoClassId> {
  try {
    const value = (await cookies()).get(DEMO_CLASS_COOKIE)?.value;

    return isDemoClassId(value) ? value : DEMO_CLASSES[0].id;
  } catch {
    return DEMO_CLASSES[0].id;
  }
}
