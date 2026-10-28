"use client";

import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex min-h-[var(--control-height)] w-full items-center rounded-[var(--radius-control)] px-3 text-sm text-[var(--muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--sunk)] hover:text-[var(--ink)]"
    >
      {dark ? "Light theme" : "Dark theme"}
    </button>
  );
}
