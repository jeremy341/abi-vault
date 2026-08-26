import { Skeleton } from "@/components/ui/skeleton";

export function ModalSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Dialoginhalt wird geladen">
      <Skeleton aria-hidden="true" className="h-10 w-full rounded-lg motion-reduce:animate-none" />
      <Skeleton aria-hidden="true" className="h-10 w-full rounded-lg motion-reduce:animate-none" />
      <Skeleton aria-hidden="true" className="h-20 w-full rounded-lg motion-reduce:animate-none" />
    </div>
  );
}
