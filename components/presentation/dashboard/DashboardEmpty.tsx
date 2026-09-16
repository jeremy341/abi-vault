import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardEmpty({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <strong className="text-sm font-semibold text-[var(--ui-ink)]">{title}</strong>
      <span className="text-xs text-[var(--ui-muted-ink)]">{description}</span>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-ink)] underline-offset-4 hover:underline"
      >
        {action}
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}
