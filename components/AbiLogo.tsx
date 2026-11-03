import Link from "next/link";

type AbiLogoProps = {
  className?: string;
  size?: "default" | "large";
  compact?: boolean;
};

export default function AbiLogo({
  className = "",
  size = "default",
  compact = false,
}: AbiLogoProps) {
  const isLarge = size === "large";

  return (
    <Link
      href="/"
      className={`flex items-center ${isLarge ? "gap-3" : "gap-2.5"} ${className}`}
      aria-label="Abi Manager Startseite"
    >
      <span
        className={`brand-link flex items-center justify-center rounded-[6px] bg-[#d4ef89] font-semibold text-[#26311f] dark:bg-[#d4ef89] dark:text-[#26311f] ${isLarge ? "h-10 w-10 text-base" : "h-8 w-8 text-sm"}`}
      >
        A
      </span>

      {compact ? null : (
        <span
          className={`${isLarge ? "text-base" : "text-sm"} font-semibold tracking-tight`}
        >
          Abi Manager
        </span>
      )}
    </Link>
  );
}
