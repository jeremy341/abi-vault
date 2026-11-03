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
      className={`wordmark ${size === "large" ? "wordmark-large" : ""} ${className}`}
      aria-label="Abi Vault home"
    >
      abi vault<span aria-hidden="true">!</span>
    </Link>
  );
}
