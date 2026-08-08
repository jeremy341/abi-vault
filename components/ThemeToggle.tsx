"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [dark, setDark] = useState(() =>
        typeof window !== "undefined" && window.localStorage.getItem("abi-theme") === "dark",
    );

    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
    }, [dark]);

    function toggleTheme() {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        window.localStorage.setItem("abi-theme", next ? "dark" : "light");
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-black/55 transition-colors hover:bg-black/[0.04] hover:text-ink dark:text-white/65 dark:hover:bg-white/[0.08] dark:hover:text-white"
            aria-label={dark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
        >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            <span>{dark ? "Helles Design" : "Dunkles Design"}</span>
        </button>
    );
}
