export function querySuccess<T extends object>(value: T): T & { ok: true } {
  return { ...value, ok: true as const };
}

export function queryFailure<E extends string>(error: E) {
  return { ok: false as const, error };
}
