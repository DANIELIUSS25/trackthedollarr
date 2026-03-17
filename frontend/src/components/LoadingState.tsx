export function LoadingState({
  message = "Loading data...",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-5 flex items-center gap-1">
        <span className="font-mono text-sm text-phosphor">&gt;</span>
        <span className="font-mono text-sm text-text-secondary">{message}</span>
        <span className="inline-block w-2 h-4 bg-phosphor animate-cursor-blink" />
      </div>
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
