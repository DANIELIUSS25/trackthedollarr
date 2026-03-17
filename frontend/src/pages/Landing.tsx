import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-surface-0 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, #c5a44e 1px, transparent 1px), radial-gradient(circle at 75% 75%, #4a7fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-1.5 text-xs font-medium text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-data-positive" />
            Public-source macroeconomic intelligence
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Where is the{" "}
            <span className="text-accent-gold">Dollar</span>{" "}
            going?
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
            Track the U.S. dollar system through official government data.
            Debt expansion, monetary policy signals, defense spending, and
            derived proxy metrics — with full methodology transparency.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/methodology" className="btn-secondary">
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* Signal categories */}
      <section className="border-b border-border-subtle bg-surface-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            Intelligence Domains
          </h2>
          <p className="mb-10 text-center text-lg text-text-secondary">
            Macro signals sourced directly from U.S. government agencies
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map((signal) => (
              <Link
                key={signal.title}
                to={signal.to}
                className="group card transition-colors hover:border-border-strong"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-4 text-lg">
                  {signal.icon}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-text-primary group-hover:text-accent-gold">
                  {signal.title}
                </h3>
                <p className="text-xs text-text-tertiary">{signal.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / provenance */}
      <section className="border-b border-border-subtle bg-surface-0 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            Data Provenance
          </h2>
          <p className="mb-10 text-center text-lg text-text-secondary">
            Every data point is traced back to its official source
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <div key={source.name} className="card">
                <h3 className="mb-1 text-sm font-semibold text-text-primary">
                  {source.name}
                </h3>
                <p className="mb-2 text-xs text-text-tertiary">{source.agency}</p>
                <p className="text-xs text-text-secondary">{source.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology transparency */}
      <section className="border-b border-border-subtle bg-surface-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-text-primary">
                Methodology-first design
              </h2>
              <p className="mb-4 text-sm text-text-secondary">
                Every metric shows exactly how it was calculated, where the
                data came from, and when it was last updated. Proxy metrics
                are explicitly labeled as derived estimates — never presented
                as official government statistics.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                {[
                  "Source timestamps on every data point",
                  "Freshness indicators flag stale data",
                  "Proxy metrics carry mandatory disclosures",
                  "Methodology notes explain calculations",
                  "Source health monitoring tracks reliability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-data-positive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="disclosure-box">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-purple">
                  Example: Proxy Metric Disclosure
                </p>
                <p className="text-sm">
                  The Monetary Expansion Proxy is a composite score combining
                  Federal Reserve balance sheet growth, reserve balances, M2
                  changes, and debt acceleration. It is not an official
                  money-printing counter or government statistic.
                </p>
              </div>
              <div className="warning-box">
                <p className="text-sm">
                  Data may be subject to revision. Treasury fiscal data is
                  updated on business days only. BLS statistics follow their
                  published release calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-0 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-text-primary">
            Ready to track the dollar?
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Access real-time macroeconomic signals from official U.S.
            government data sources — with full transparency and no spin.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Open the Dashboard
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

const signals = [
  {
    icon: "$",
    title: "Dollar Strength",
    description: "Broad dollar index, z-score, and trend analysis",
    to: "/dollar-strength",
  },
  {
    icon: "D",
    title: "National Debt",
    description: "Total debt, public holdings, growth velocity",
    to: "/debt",
  },
  {
    icon: "%",
    title: "Inflation & Rates",
    description: "CPI, core inflation, Fed funds, Treasury yields",
    to: "/inflation",
  },
  {
    icon: "M",
    title: "Money Supply",
    description: "M2, Fed assets, reserve balances",
    to: "/money-supply",
  },
  {
    icon: "P",
    title: "Monetary Expansion Proxy",
    description: "Derived composite of balance sheet and liquidity signals",
    to: "/monetary-expansion-proxy",
  },
  {
    icon: "W",
    title: "War Spending Proxy",
    description: "Derived composite of defense and security aid signals",
    to: "/war-spending-proxy",
  },
  {
    icon: "F",
    title: "Defense & Foreign Aid",
    description: "DoD obligations, contracts, security assistance",
    to: "/defense-spending",
  },
  {
    icon: "S",
    title: "Source Health",
    description: "Live data source reliability and freshness monitoring",
    to: "/source-health",
  },
];

const sources = [
  {
    name: "FRED",
    agency: "Federal Reserve Bank of St. Louis",
    description: "Dollar index, Fed funds rate, Treasury yields, M2, breakeven inflation rates.",
  },
  {
    name: "Treasury Fiscal Data",
    agency: "U.S. Department of the Treasury",
    description: "Debt to the Penny, Daily Treasury Statement, Monthly Treasury Statement.",
  },
  {
    name: "Federal Reserve",
    agency: "Board of Governors",
    description: "Balance sheet assets, reserve balances, and monetary policy data.",
  },
  {
    name: "USAspending",
    agency: "U.S. Department of the Treasury",
    description: "DoD budgetary resources, obligations, outlays, and contract awards.",
  },
  {
    name: "Foreign Assistance",
    agency: "USAID / State Department",
    description: "Foreign assistance obligations and disbursements, security sector breakdowns.",
  },
  {
    name: "BLS",
    agency: "Bureau of Labor Statistics",
    description: "Consumer Price Index (all items and core) monthly releases.",
  },
];
