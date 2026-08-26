"use server";

export async function createTransfer(input: unknown) {
  void input;
  return { ok: false as const, error: "TRANSFERS_DISABLED" };
}
