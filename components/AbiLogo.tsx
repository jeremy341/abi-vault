import Link from "next/link";

type AbiLogoProps = {
  className?: string;
  size?: "default" | "large";
};

export default function AbiLogo({
  className = "",
  size = "default",
}: AbiLogoProps) {
  return (
    <Link
      href="/"
      className={`font-semibold text-foreground ${size === "large" ? "text-lg" : "text-[0.9375rem]"} ${className}`}
      aria-label="Abi Vault home"
    >
      Abi Vault
    </Link>
  );
}
