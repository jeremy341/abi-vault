import { useEffect, useRef } from "react";

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusFirstInvalidField(formRef: {
  current: HTMLFormElement | null;
}) {
  window.requestAnimationFrame(() => {
    const invalidField = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    if (invalidField) {
      invalidField.focus();
    }
  });
}

function keepFocusInside(
  event: KeyboardEvent,
  first: HTMLElement | undefined,
  last: HTMLElement | undefined,
) {
  if (!first || !last) {
    return;
  }

  const focusIsOnFirst = document.activeElement === first;
  const focusIsOnLast = document.activeElement === last;

  if (event.shiftKey && focusIsOnFirst) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && focusIsOnLast) {
    event.preventDefault();
    first.focus();
  }
}

export function useCardModalFocus(
  open: boolean,
  formRef: { current: HTMLFormElement | null },
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const form = formRef.current;
    const focusable = form
      ? Array.from(form.querySelectorAll<HTMLElement>(focusableSelector))
      : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const firstInput = form ? form.querySelector<HTMLElement>("input") : null;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const target = firstInput ?? first;

      if (target) {
        target.focus();
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }

      if (event.key === "Tab") {
        keepFocusInside(event, first, last);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [open]);
}
