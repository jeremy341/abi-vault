export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_PAYLOAD"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERIOD_LOCKED"
  | "DATABASE_ERROR";

export type ActionResult<T> =
  | { success: true; data: T; timestamp: string }
  | {
      success: false;
      error: { code: ApiErrorCode; message: string };
      timestamp: string;
    };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}

export function actionFailure<T = never>(
  code: ApiErrorCode,
  message: string,
): ActionResult<T> {
  return {
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}
