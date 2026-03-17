import type { ApiRange } from "../lib/types";
import { RangeSelector } from "./RangeSelector";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  range?: ApiRange;
  onRangeChange?: (range: ApiRange) => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  range,
  onRangeChange,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {range && onRangeChange && (
          <RangeSelector value={range} onChange={onRangeChange} />
        )}
        {children}
      </div>
    </div>
  );
}
