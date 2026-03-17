import type { MethodologyRef } from "../lib/types";

interface ProxyDisclosureProps {
  warnings: string[];
  methodology: MethodologyRef | null;
  compact?: boolean;
}

export function ProxyDisclosure({
  warnings,
  methodology,
  compact = false,
}: ProxyDisclosureProps) {
  return (
    <div className={compact ? "space-y-2.5" : "space-y-3.5"}>
      {warnings.length > 0 && (
        <div className="warning-box">
          <div className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-data-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="space-y-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm leading-relaxed text-text-secondary">
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {methodology && !compact && (
        <div className="disclosure-box">
          <p className="mb-1.5 section-label text-accent-purple">
            Methodology
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            {methodology.summary}
          </p>
          {methodology.limitations && (
            <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
              <span className="font-medium text-text-secondary">
                Limitations:
              </span>{" "}
              {methodology.limitations}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
