import Link from "next/link";


export default function AbiLogo({ className = "" }: { className?: string }) {
    return (
        <Link
            href="/"
            className={`flex items-center gap-2.5 ${className}`}
            aria-label="Abi Manager Startseite"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
            A
          </span>

            <span className="text-sm font-semibold tracking-tight">
            Abi Manager
          </span>
        </Link>
    );
}
