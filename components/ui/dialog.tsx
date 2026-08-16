"use client";

import { useEffect } from "react";

type DialogProps = {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  overlayClassName: string;
  dialogClassName: string;
};

export function Dialog({ children, onClose, label, overlayClassName, dialogClassName }: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={overlayClassName}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={dialogClassName} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
