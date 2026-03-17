export function makeEnvelope<T>(params: {
  data: T;
  metadata: Record<string, unknown>;
  warnings?: string[];
}) {
  return {
    data: params.data,
    metadata: params.metadata,
    warnings: params.warnings ?? []
  };
}
