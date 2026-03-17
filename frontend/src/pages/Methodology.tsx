import { api } from "../lib/api";
import { useApi } from "../lib/hooks";
import type { MethodologyNote } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { formatDate } from "../lib/format";

export function Methodology() {
  const { data, loading, error, refetch } = useApi<MethodologyNote[]>(
    () => api.methodology(),
    undefined,
    [],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <LoadingState message="Loading methodology..." />;

  return (
    <div>
      <PageHeader
        title="Methodology"
        subtitle="How every metric is sourced, calculated, and disclosed"
      />

      <div className="mb-6 disclosure-box">
        <p>
          TrackTheDollar presents data sourced exclusively from official U.S.
          government agencies. Derived proxy metrics are composite scores
          calculated from these official data points and are clearly labeled
          as proxies. They should not be interpreted as official government
          statistics. All calculations and their limitations are documented
          below.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-sm text-text-tertiary py-12">
          No methodology notes available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((note) => (
            <div key={note.slug} className="card">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    {note.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    v{note.version} · Effective {formatDate(note.effectiveAt)}
                  </p>
                </div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-surface-4 px-2 py-0.5 text-2xs text-text-tertiary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="mb-3 text-sm text-text-secondary">{note.summary}</p>

              {note.disclosure && (
                <div className="mb-3 rounded bg-accent-purple/5 border border-accent-purple/15 px-3 py-2">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-accent-purple mb-1">
                    Disclosure
                  </p>
                  <p className="text-xs text-text-secondary">{note.disclosure}</p>
                </div>
              )}

              {note.limitations && (
                <div className="mb-3 rounded bg-data-warning/5 border border-data-warning/15 px-3 py-2">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-data-warning mb-1">
                    Limitations
                  </p>
                  <p className="text-xs text-text-secondary">{note.limitations}</p>
                </div>
              )}

              {note.contentMarkdown && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-accent-blue hover:text-accent-gold">
                    Show full methodology details
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap rounded bg-surface-3 px-4 py-3 font-mono text-xs text-text-secondary">
                    {note.contentMarkdown}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
