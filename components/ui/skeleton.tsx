import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("ui-skeleton rounded-[var(--radius-control)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
