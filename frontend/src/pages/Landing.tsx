import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-10">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border-subtle px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        {/* Animated mesh background */}
        <div className="absolute inset-0 bg-hero-mesh opacity-60" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #c9a94e 1px, transparent 1px), radial-gradient(circle at 75% 75%, #5b8def 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gold/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-y-1/3 rounded-full bg-accent-blue/[0.06] blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center animate-fade-up">
          {/* Status badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface-2/60 px-5 py-2 text-xs font-medium text-text-secondary backdrop-blur-sm">
            <span className="glow-dot h-2 w-2" />
            Public-source macroeconomic intelligence
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Where is the{" "}
            <span className="text-gradient-gold">Dollar</span>{" "}
            going?
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Track the U.S. dollar system through official government data.
            Debt expansion, monetary policy signals, defense spending, and
            derived proxy metrics — with full methodology transparency.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link to="/methodology" className="btn-secondary">
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* ── Signal categories ── */}
      <section className="border-b border-border-subtle px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-up">
            <p className="section-label mb-3">Intelligence Domains</p>
            <p className="text-lg text-text-secondary">
              Macro signals sourced directly from U.S. government agencies
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map((signal, i) => (
              <Link
                key={signal.title}
                to={signal.to}
                className="card card-interactive group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3/80 text-base font-bold text-accent-gold ring-1 ring-border-subtle">
                  {signal.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-text-primary group-hover:text-accent-gold transition-colors">
                  {signal.title}
                </h3>
                <p className="text-xs leading-relaxed text-text-muted">
                  {signal.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data provenance ── */}
      <section className="border-b border-border-subtle bg-surface-0 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center animate-fade-up">
            <p className="section-label mb-3">Data Provenance</p>
            <p className="text-lg text-text-secondary">
              Every data point is traced back to its official source
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source, i) => (
              <div
                key={source.name}
                className="card group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue-dim text-xs font-bold text-accent-blue ring-1 ring-accent-blue/10">
                    {source.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {source.name}
                    </h3>
                    <p className="text-2xs text-text-muted">{source.agency}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {source.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Methodology transparency ── */}
      <section className="border-b border-border-subtle px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="section-label mb-3">Our Approach</p>
              <h2 className="mb-5 text-2xl font-bold tracking-tight text-text-primary">
                Methodology-first design
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                Every metric shows exactly how it was calculated, where the
                data came from, and when it was last updated. Proxy metrics
                are explicitly labeled as derived estimates — never presented
                as official government statistics.
              </p>
              <ul className="space-y-3 text-sm text-text-secondary">
                {[
                  "Source timestamps on every data point",
                  "Freshness indicators flag stale data",
                  "Proxy metrics carry mandatory disclosures",
                  "Methodology notes explain calculations",
                  "Source health monitoring tracks reliability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-data-positive-dim">
                      <svg
                        className="h-3 w-3 text-data-positive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="disclosure-box">
                <p className="mb-2 section-label text-accent-purple">
                  Example: Proxy Metric Disclosure
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The Monetary Expansion Proxy is a composite score combining
                  Federal Reserve balance sheet growth, reserve balances, M2
                  changes, and debt acceleration. It is not an official
                  money-printing counter or government statistic.
                </p>
              </div>
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
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Data may be subject to revision. Treasury fiscal data is
                    updated on business days only. BLS statistics follow their
                    published release calendar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-t from-accent-gold/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-2xl text-center animate-fade-up">
          <h2 className="mb-5 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Ready to track the dollar?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-text-secondary sm:text-base">
            Access real-time macroeconomic signals from official U.S.
            government data sources — with full transparency and no spin.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Open the Dashboard
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
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
    description:
      "Dollar index, Fed funds rate, Treasury yields, M2, breakeven inflation rates.",
  },
  {
    name: "Treasury Fiscal Data",
    agency: "U.S. Department of the Treasury",
    description:
      "Debt to the Penny, Daily Treasury Statement, Monthly Treasury Statement.",
  },
  {
    name: "Federal Reserve",
    agency: "Board of Governors",
    description:
      "Balance sheet assets, reserve balances, and monetary policy data.",
  },
  {
    name: "USAspending",
    agency: "U.S. Department of the Treasury",
    description:
      "DoD budgetary resources, obligations, outlays, and contract awards.",
  },
  {
    name: "Foreign Assistance",
    agency: "USAID / State Department",
    description:
      "Foreign assistance obligations and disbursements, security sector breakdowns.",
  },
  {
    name: "BLS",
    agency: "Bureau of Labor Statistics",
    description:
      "Consumer Price Index (all items and core) monthly releases.",
  },
];
