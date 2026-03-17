export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent-gold" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="mb-4 h-3 w-32 rounded bg-surface-4" />
          <div className="mb-2 h-8 w-24 rounded bg-surface-4" />
          <div className="h-40 rounded bg-surface-4" />
        </div>
      ))}
    </div>
  );
}
