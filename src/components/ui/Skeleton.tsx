interface Props {
  className?: string;
}

/** Shimmering placeholder block. Compose several to mock a loading layout. */
export default function Skeleton({ className }: Props) {
  return <div className={`shimmer rounded-xl ${className ?? ''}`} />;
}

/** A list of skeleton expense rows, matching ExpenseCard's footprint. */
export function ExpenseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-surface rounded-2xl p-3.5 border border-border/60"
        >
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3.5 w-12" />
        </div>
      ))}
    </div>
  );
}
