export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_PAYLOAD"
  | "INVALID_INPUT"
  | "INVALID_AMOUNT"
  | "ACCOUNT_SETUP_INCOMPLETE"
  | "CASH_COUNT_FAILED"
  | "TRANSACTION_CREATE_FAILED"
  | "TRANSFERS_DISABLED"
  | "GOAL_UPDATE_FAILED"
  | "GOAL_ARCHIVE_FAILED"
  | "SETTINGS_UPDATE_FAILED"
  | "ROLE_UPDATE_FAILED"
  | "LAST_ADMIN_REQUIRED"
  | "SELF_REMOVAL_NOT_ALLOWED"
  | "MEMBER_NOT_FOUND"
  | "MEMBER_REMOVAL_FAILED"
  | "INVITATION_FAILED"
  | "LINK_CREATE_FAILED"
  | "INVALID_LINK"
  | "LINK_EXPIRED"
  | "LINK_ALREADY_USED"
  | "MEMBERSHIP_CREATE_FAILED"
  | "MEMBERSHIP_SYNC_FAILED"
  | "EXPORT_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERIOD_LOCKED"
  | "DATABASE_ERROR";

export type ActionResult<T> =
  | { ok: true; success: true; data: T; timestamp: string }
  | {
      ok: false;
      success: false;
      error: { code: ApiErrorCode; message: string };
      timestamp: string;
    };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, success: true, data, timestamp: new Date().toISOString() };
}

export function actionFailure<T = never>(
  code: ApiErrorCode,
  message: string,
): ActionResult<T> {
  return {
    ok: false,
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}
