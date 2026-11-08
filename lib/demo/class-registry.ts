export type DemoClass = { id: string; name: string };
export type CustomDemoClass = DemoClass;

export const MAX_CUSTOM_DEMO_CLASSES = 10;
export const MAX_DEMO_CLASS_NAME_LENGTH = 80;
export const MAX_DEMO_CLASS_REGISTRY_LENGTH = 3500;

export function parseCustomDemoClasses(value: string | undefined): CustomDemoClass[] {
  if (!value || value.length > MAX_DEMO_CLASS_REGISTRY_LENGTH) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const classes: CustomDemoClass[] = [];
    for (const item of parsed) {
      if (
        !item || typeof item !== "object" ||
        typeof item.id !== "string" || !/^class-(?:20\d{2}|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i.test(item.id) ||
        typeof item.name !== "string" || item.name.trim().length < 2 ||
        item.name.trim().length > MAX_DEMO_CLASS_NAME_LENGTH
      ) continue;
      if (!classes.some((demoClass) => demoClass.id === item.id)) {
        classes.push({ id: item.id, name: item.name.trim() });
      }
      if (classes.length >= MAX_CUSTOM_DEMO_CLASSES) break;
    }
    return classes;
  } catch {
    return [];
  }
}

export function resolveDemoClasses(
  defaults: readonly DemoClass[],
  custom: readonly CustomDemoClass[],
): DemoClass[] {
  const overrides = new Map(custom.map((item) => [item.id, item.name]));
  const builtIn = defaults.map((item) => ({ ...item, name: overrides.get(item.id) ?? item.name }));
  const builtInIds = new Set(defaults.map((item) => item.id));
  return [...builtIn, ...custom.filter((item) => !builtInIds.has(item.id))];
}

export function isKnownDemoClassId(
  id: string | undefined,
  defaults: readonly DemoClass[],
  custom: readonly CustomDemoClass[],
): id is string {
  return Boolean(id && [...defaults, ...custom].some((item) => item.id === id));
}
