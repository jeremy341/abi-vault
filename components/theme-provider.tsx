"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function applyTheme(isDark: boolean) {
  const root = document.documentElement;

  root.classList.add("theme-switching");
  root.classList.toggle("dark", isDark);
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() => root.classList.remove("theme-switching")),
  );
}

type ThemeContextValue = {
  dark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("abi-theme");

    const isDark =
      stored === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : stored === "dark";

    window.setTimeout(() => setDark(isDark), 0);
    applyTheme(isDark);
  }, []);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      applyTheme(next);
      window.localStorage.setItem("abi-theme", next ? "dark" : "light");

      return next;
    });
  }

  const value = useMemo(() => ({ dark, toggleTheme }), [dark]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) throw new Error("useTheme must be used inside ThemeProvider");

  return context;
}
