"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-black/55 transition-colors hover:bg-black/[0.04] hover:text-ink dark:text-white/65 dark:hover:bg-white/[0.08] dark:hover:text-white"
      aria-label={
        dark ? "Enable light mode" : "Enable dark mode"
      }
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <span>{dark ? "Helles Design" : "Dark mode"}</span>
    </button>
  );
}
