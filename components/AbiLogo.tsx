import Link from "next/link";

type AbiLogoProps = {
    className?: string;
    size?: "default" | "large";
};

export default function AbiLogo({ className = "", size = "default" }: AbiLogoProps) {
    const isLarge = size === "large";

    return (
        <Link
            href="/"
            className={`flex items-center ${isLarge ? "gap-3" : "gap-2.5"} ${className}`}
            aria-label="Abi Manager Startseite"
        >
            <span className={`brand-link flex items-center justify-center rounded-lg bg-ink font-semibold text-white dark:bg-black dark:text-white ${isLarge ? "h-10 w-10 text-base" : "h-8 w-8 text-sm"}`}>
                A
            </span>

            <span className={`${isLarge ? "text-base" : "text-sm"} font-semibold tracking-tight`}>
                Abi Manager
            </span>
        </Link>
    );
}
