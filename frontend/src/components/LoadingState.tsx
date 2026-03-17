export function LoadingState({
  message = "Loading data...",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-5">
        <div className="h-10 w-10 rounded-full border-2 border-surface-4" />
        <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-accent-gold" />
      </div>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="mb-4 h-3 w-28 skeleton-shimmer" />
          <div className="mb-3 h-7 w-20 skeleton-shimmer" />
          <div className="h-44 skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
