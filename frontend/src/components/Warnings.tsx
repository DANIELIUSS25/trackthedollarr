export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div key={i} className="warning-box">
          {w}
        </div>
      ))}
    </div>
  );
}
