"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-[var(--ui-control-radius)] px-4 py-3 text-sm text-[var(--ui-muted-ink)] transition-colors hover:bg-[var(--ui-surface-control-muted)] hover:text-ink"
      aria-label={
        dark ? "Enable light mode" : "Enable dark mode"
      }
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <span>{dark ? "Helles Design" : "Dark mode"}</span>
    </button>
  );
}
