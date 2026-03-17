import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { formatValue } from "../lib/format";
import type { OverviewData } from "../lib/types";

/* ═══════════════════════════════════════════════════════════
   Landing — Terminal-style homepage for TrackTheDollar.com
   ═══════════════════════════════════════════════════════════ */

export function Landing() {
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    api.overview({ range: "30d" }).then((res) => setOverview(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-terminal-black text-text-primary">
      <SiteNav />
      <Hero overview={overview} />
      <SignalStrip overview={overview} />
      <SystemSection />
      <MonetaryProxySection overview={overview} />
      <WarProxySection overview={overview} />
      <SourcesSection />
      <ResearchSection />
      <SiteFooter />
    </div>
  );
}

/* ─── 1. Navigation ─── */

function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-terminal-border bg-terminal-black">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-phosphor/70 bg-phosphor-dim" style={{ boxShadow: '0 0 8px rgba(0,255,65,0.2)' }}>
            <span className="font-mono text-base font-black leading-none text-phosphor">$</span>
          </div>
          <span className="text-[13px] font-black uppercase tracking-[0.2em] text-phosphor">
            TrackTheDollar
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/dashboard" className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-phosphor">
            Dashboard
          </Link>
          <Link to="/methodology" className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-phosphor">
            Methodology
          </Link>
          <Link to="/source-health" className="text-[13px] font-medium text-text-tertiary transition-colors hover:text-phosphor">
            Sources
          </Link>
          <Link
            to="/dashboard"
            className="border border-phosphor/40 bg-phosphor-dim px-4 py-1.5 text-[13px] font-semibold uppercase tracking-wider text-phosphor transition-colors hover:border-phosphor hover:bg-phosphor/10"
          >
            Open Terminal &rarr;
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-text-tertiary md:hidden"
          aria-label="Menu"
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            {mobileOpen ? (
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-terminal-border bg-terminal-panel px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="text-sm text-text-secondary hover:text-phosphor">Dashboard</Link>
            <Link to="/methodology" className="text-sm text-text-secondary hover:text-phosphor">Methodology</Link>
            <Link to="/source-health" className="text-sm text-text-secondary hover:text-phosphor">Sources</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── 2. Hero ─── */

function Hero() {
  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
            <span className="text-phosphor">&gt;</span>
            Live U.S. Fiscal Intelligence — Official Data Only
          </p>

          <h1 className="text-[2.5rem] font-bold leading-[1.06] tracking-tight sm:text-[3.25rem] lg:text-[4rem]">
            <span className="text-phosphor">U.S. National Debt</span>
            <br />
            <span className="text-text-primary">has crossed $39 trillion</span>
          </h1>

          <p className="mt-7 max-w-lg text-[15px] leading-[1.7] text-text-secondary">
            TrackTheDollar is the live national debt tracker built on official U.S. government sources.
            Monitor debt, dollar strength, inflation, interest rates, and defense spending — all in one terminal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="border border-phosphor/20 bg-phosphor-dim px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-phosphor">
              Live National Debt
            </div>
            <div className="border border-terminal-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Official Sources Only
            </div>
            <div className="border border-terminal-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Updated Daily
            </div>
          </div>

          <div className="mt-10 flex items-center gap-5">
            <Link to="/dashboard" className="btn-primary">
              Track The Dollar &rarr;
            </Link>
            <Link to="/debt" className="btn-secondary">
              View Debt Data
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-terminal-border" />
    </section>
  );
}

/* ─── 3. Signal Strip ─── */

function SignalStrip({ overview }: { overview: OverviewData | null }) {
  const fmt = (item: { value: number | null; unit: string } | null | undefined) =>
    item ? formatValue(item.value, item.unit) : "—";

  const liveSignals = [
    { label: "Dollar Index", display: fmt(overview?.summary.dollar), source: "FRED · Fed", to: "/dollar-strength" },
    { label: "National Debt", display: fmt(overview?.summary.debt), source: "Treasury", to: "/debt" },
    { label: "M2 Supply", display: fmt(overview?.summary.m2), source: "FRED · Fed", to: "/money-supply" },
    { label: "CPI", display: fmt(overview?.summary.inflation), source: "BLS", to: "/inflation" },
    { label: "Defense", display: fmt(overview?.summary.defenseObligations), source: "USAspending", to: "/defense-spending" },
    { label: "Sources", display: "6 / 6", source: "All active", to: "/source-health" },
  ];

  return (
    <section className="border-b border-terminal-border">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-terminal-border">
          {liveSignals.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="group relative px-5 py-5 transition-colors hover:bg-terminal-surface sm:px-6 sm:py-6"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent transition-colors group-hover:bg-phosphor/30" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">{s.label}</p>
              <p className="mt-2.5 font-mono text-lg font-semibold tracking-tight text-phosphor sm:text-xl">{s.display}</p>
              <p className="mt-1.5 text-[11px] text-text-tertiary">{s.source}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. System Section ─── */

function SystemSection() {
  return (
    <section className="border-b border-terminal-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
              <span className="text-phosphor">&gt;</span> System Architecture
            </p>
            <h2 className="mb-5 text-[1.75rem] font-bold leading-[1.15] tracking-tight sm:text-[2rem]">
              <span className="text-text-primary">Five pressure channels</span><br />
              <span className="text-text-secondary">drive the dollar system</span>
            </h2>
            <p className="max-w-md text-[15px] leading-[1.7] text-text-secondary">
              TrackTheDollar monitors each channel through primary official
              sources. No third-party intermediaries. No proprietary models.
            </p>
          </div>

          <div className="divide-y divide-terminal-border border-t border-terminal-border">
            {systemChannels.map((ch, i) => (
              <div key={ch.name} className="flex items-start gap-5 py-5 sm:gap-6">
                <span className="mt-0.5 w-6 text-center font-mono text-xs font-medium text-phosphor/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{ch.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-tertiary">{ch.description}</p>
                </div>
                <span className="hidden shrink-0 text-[11px] font-medium text-phosphor/40 sm:block">{ch.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 5. Monetary Expansion Proxy ─── */

function MonetaryProxySection({ overview }: { overview: OverviewData | null }) {
  const proxy = overview?.metrics.monetaryExpansionProxy;
  const score = proxy?.value != null ? proxy.value.toFixed(1) : "—";

  return (
    <section className="border-b border-terminal-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">Derived Metric</p>
              <span className="badge badge-proxy">Proxy</span>
            </div>
            <h2 className="mb-5 text-[1.5rem] font-bold leading-[1.2] tracking-tight text-text-primary sm:text-[1.75rem]">
              Monetary Expansion Proxy
            </h2>
            <p className="mb-5 text-[15px] leading-[1.7] text-text-secondary">
              A composite score combining Federal Reserve balance sheet growth,
              reserve balances, M2 velocity, and debt acceleration — designed to
              approximate the directional pressure of monetary expansion.
            </p>
            <p className="text-[13px] leading-[1.7] text-text-muted">
              Not an official statistic. Derived estimate with documented
              methodology and disclosed limitations.
            </p>
            <div className="mt-8 flex gap-2">
              <span className="border border-terminal-border bg-terminal-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Composite Index</span>
              <span className="border border-terminal-border bg-terminal-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">4 Components</span>
            </div>
            <div className="mt-8">
              <Link to="/monetary-expansion-proxy" className="text-[13px] font-semibold text-phosphor/70 transition-colors hover:text-phosphor">
                View full methodology &rarr;
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="border border-terminal-border bg-terminal-surface p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Monetary Expansion Proxy</span>
                {proxy && !proxy.stale && (
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-phosphor">
                    <span className="h-1.5 w-1.5 bg-phosphor" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center py-10">
                <p className="font-mono text-6xl font-black tracking-tight text-phosphor" style={{ textShadow: '0 0 20px rgba(0,255,65,0.3)' }}>
                  {score}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  out of 100 — current score
                </p>
                {proxy?.stale && (
                  <p className="mt-2 text-[10px] text-amber">Data may be stale</p>
                )}
              </div>
              <div className="mt-2 h-1 w-full bg-terminal-raised">
                {proxy?.value != null && (
                  <div
                    className="h-full bg-phosphor transition-all"
                    style={{ width: `${Math.min(proxy.value, 100)}%`, boxShadow: '0 0 6px rgba(0,255,65,0.4)' }}
                  />
                )}
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-text-muted">
                Sources: Federal Reserve, U.S. Treasury, FRED.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. War Spending Proxy ─── */

function WarProxySection({ overview }: { overview: OverviewData | null }) {
  const proxy = overview?.metrics.warSpendingProxy;
  const score = proxy?.value != null ? proxy.value.toFixed(1) : "—";

  return (
    <section className="border-b border-terminal-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-5 lg:gap-16">
          <div className="order-2 lg:order-1 lg:col-span-3">
            <div className="border border-terminal-border bg-terminal-surface p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                  War Spending Proxy — Component Weights
                </span>
                {proxy && !proxy.stale && (
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-phosphor">
                    <span className="h-1.5 w-1.5 bg-phosphor" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center py-6 border-b border-terminal-border mb-6">
                <p className="font-mono text-5xl font-black tracking-tight text-phosphor" style={{ textShadow: '0 0 20px rgba(0,255,65,0.3)' }}>
                  {score}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  current score / 100
                </p>
              </div>
              <div className="divide-y divide-terminal-border">
                {warComponents.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.name}</p>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">{c.source}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold tabular-nums text-phosphor">{c.weight}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-text-muted">
                All components sourced from USAspending.gov and foreignassistance.gov.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">Derived Metric</p>
              <span className="badge badge-proxy">Proxy</span>
            </div>
            <h2 className="mb-5 text-[1.5rem] font-bold leading-[1.2] tracking-tight text-text-primary sm:text-[1.75rem]">
              War Spending Proxy
            </h2>
            <p className="mb-5 text-[15px] leading-[1.7] text-text-secondary">
              A composite score combining DoD obligations, contract awards,
              and foreign security assistance disbursements — designed to
              approximate the directional pressure of defense-related spending.
            </p>
            <p className="text-[13px] leading-[1.7] text-text-muted">
              Not an official defense spending tracker. Derived estimate
              combining multiple official data sources with documented methodology.
            </p>
            <div className="mt-8">
              <Link to="/war-spending-proxy" className="text-[13px] font-semibold text-phosphor/70 transition-colors hover:text-phosphor">
                View full methodology &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 7. Sources ─── */

function SourcesSection() {
  return (
    <section className="border-b border-terminal-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 max-w-xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
            <span className="text-phosphor">&gt;</span> Data Provenance
          </p>
          <h2 className="mb-5 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-text-primary sm:text-[2rem]">
            Official sources only
          </h2>
          <p className="text-[15px] leading-[1.7] text-text-secondary">
            Every data point sourced directly from U.S. government agencies.
            No third-party aggregators. Full attribution and freshness
            monitoring on every metric.
          </p>
        </div>

        <div className="grid gap-px bg-terminal-border sm:grid-cols-2 lg:grid-cols-3 overflow-hidden">
          {sources.map((src) => (
            <div key={src.name} className="bg-terminal-black p-7 sm:p-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-text-primary">{src.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-phosphor shadow-glow" />
                  <span className="text-[10px] font-medium text-phosphor/60">ACTIVE</span>
                </div>
              </div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">{src.agency}</p>
              <p className="text-[13px] leading-[1.65] text-text-tertiary">{src.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/source-health" className="text-[13px] font-semibold text-phosphor/70 transition-colors hover:text-phosphor">
            View source health dashboard &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── 8. Research ─── */

function ResearchSection() {
  return (
    <section className="border-b border-terminal-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
              <span className="text-phosphor">&gt;</span> Intelligence Briefings
            </p>
            <h2 className="mb-5 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-text-primary sm:text-[2rem]">
              Research &amp; analysis
            </h2>
            <p className="text-[15px] leading-[1.7] text-text-secondary">
              Structured briefings on macro regime shifts, dollar system stress
              tests, and methodology updates. Written for institutional audiences.
            </p>
          </div>

          <div>
            {briefings.map((b, i) => (
              <div key={b.title} className={`flex items-start gap-5 py-5 ${i < briefings.length - 1 ? "border-b border-terminal-border" : ""}`}>
                <span className="mt-0.5 shrink-0 border border-amber/30 bg-amber-dim px-2 py-0.5 font-mono text-[10px] font-medium text-amber">
                  {b.date}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-text-primary">{b.title}</p>
                  <p className="mt-1.5 text-[12px] text-text-tertiary">{b.category}</p>
                </div>
              </div>
            ))}
            <p className="pt-5 text-[12px] text-text-muted">
              Briefings publishing soon. Platform currently in data-only mode.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 9. Footer ─── */

function SiteFooter() {
  return (
    <footer className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              <span className="text-phosphor">[$]</span> TrackTheDollar
            </p>
            <p className="mt-4 text-[13px] leading-[1.7] text-text-muted">
              Macro intelligence terminal. Official government data
              with full methodology transparency.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Platform</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/dashboard" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Dashboard</Link>
              <Link to="/dollar-strength" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Dollar Strength</Link>
              <Link to="/debt" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">National Debt</Link>
              <Link to="/inflation" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Inflation</Link>
              <Link to="/rates" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Interest Rates</Link>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Transparency</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/methodology" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Methodology</Link>
              <Link to="/source-health" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Source Health</Link>
              <Link to="/monetary-expansion-proxy" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">Monetary Proxy</Link>
              <Link to="/war-spending-proxy" className="text-[13px] text-text-tertiary transition-colors hover:text-phosphor">War Spending Proxy</Link>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-terminal-border pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-text-muted">&copy; {new Date().getFullYear()} TrackTheDollar.com</p>
            <p className="max-w-md text-[11px] leading-relaxed text-text-muted sm:text-right">
              Not investment advice. All data from official U.S. government agencies. Proxy metrics are derived estimates.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════ */


const systemChannels = [
  { name: "Interest Rates", description: "Fed Funds rate and Treasury yield curve set the price of money", source: "FRED" },
  { name: "Debt Issuance", description: "Treasury borrowing velocity and outstanding obligations", source: "Treasury Fiscal Data" },
  { name: "Liquidity & Money Supply", description: "M2, Fed balance sheet, and reserve balances drive system liquidity", source: "Federal Reserve" },
  { name: "Inflation Pressure", description: "CPI, core inflation, and breakeven expectations signal price regime", source: "BLS / FRED" },
  { name: "Global Dollar Demand", description: "Broad Dollar Index measures relative strength against trading partners", source: "FRED" },
];


const warComponents = [
  { name: "DoD Budget Authority", source: "USAspending.gov", weight: "30%" },
  { name: "DoD Obligations", source: "USAspending.gov", weight: "25%" },
  { name: "Defense Contract Awards", source: "USAspending.gov", weight: "25%" },
  { name: "Foreign Security Assistance", source: "foreignassistance.gov", weight: "20%" },
];

const sources = [
  { name: "FRED", agency: "Federal Reserve Bank of St. Louis", description: "Dollar index, Fed funds rate, Treasury yields, M2, breakeven inflation rates." },
  { name: "Treasury Fiscal Data", agency: "U.S. Department of the Treasury", description: "Debt to the Penny, Daily Treasury Statement, Monthly Treasury Statement." },
  { name: "Federal Reserve", agency: "Board of Governors", description: "Balance sheet assets, reserve balances, and monetary policy data." },
  { name: "USAspending", agency: "U.S. Department of the Treasury", description: "DoD budgetary resources, obligations, outlays, and contract awards." },
  { name: "Foreign Assistance", agency: "USAID / State Department", description: "Foreign assistance obligations and disbursements, security sector data." },
  { name: "BLS", agency: "Bureau of Labor Statistics", description: "Consumer Price Index — all items and core, monthly releases." },
];

const briefings = [
  { date: "Coming", title: "Dollar Index Regime Analysis: Current Cycle Position", category: "Dollar System" },
  { date: "Coming", title: "Debt Acceleration and Yield Curve Implications", category: "Fiscal Pressure" },
  { date: "Coming", title: "Proxy Methodology Update: Component Weight Review", category: "Methodology" },
];
