import { actionFailure, type ActionResult } from "@/lib/api/result";

export function demoReadOnlyFailure<T = never>(): ActionResult<T> {
  return actionFailure(
    "DEMO_READ_ONLY",
    "The sample-data demo is read-only. Changes are not saved.",
  );
}
