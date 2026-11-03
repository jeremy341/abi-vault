import dlg from "./dialog.module.css";

export function inputClassName(error: string | undefined) {
  if (error) {
    return `${dlg.input} ${dlg.inputInvalid}`;
  }

  return dlg.input;
}

export function Field({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <label className={dlg.field}>
      <span>{label}</span>
      {children}
      <span id={errorId} className={dlg.fieldError} aria-live="polite">
        {error || " "}
      </span>
    </label>
  );
}
