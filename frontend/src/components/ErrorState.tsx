interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="mb-5 flex h-14 w-14 items-center justify-center border border-data-negative/30 bg-data-negative-dim">
        <span className="font-mono text-lg font-bold text-data-negative">!</span>
      </div>
      <p className="mb-5 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}
