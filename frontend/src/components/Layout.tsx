import { Link, Outlet, useLocation } from "react-router-dom";
import { Nav } from "./Nav";
import { useEffect, useState } from "react";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface-0">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] flex-shrink-0 lg:block">
        <div className="fixed top-0 flex h-screen w-[260px] flex-col border-r border-border-subtle bg-surface-1/80 backdrop-blur-xl">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 border-b border-border-subtle px-6 py-5"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-gold to-accent-gold-bright shadow-glow">
              <span className="text-base font-bold text-surface-0">$</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-text-primary">
                TrackTheDollar
              </span>
              <span className="block text-2xs font-medium text-text-muted">
                Macro Intelligence
              </span>
            </div>
          </Link>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto">
            <Nav />
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-border-subtle p-4">
            <div className="rounded-lg bg-surface-3/40 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-data-positive glow-dot" />
                <span className="text-2xs font-medium text-text-tertiary">
                  Live data feeds active
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle px-4 py-3 lg:hidden glass-strong">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-gold to-accent-gold-bright shadow-glow">
            <span className="text-sm font-bold text-surface-0">$</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">
            TrackTheDollar
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-3/50 hover:text-text-primary"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            {mobileOpen ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border-subtle bg-surface-1/95 pt-16 backdrop-blur-xl animate-slide-in">
            <Nav />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </div>
        <footer className="mt-12 border-t border-border-subtle">
          <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-xs text-text-muted">
                TrackTheDollar.com — Institutional-grade macro intelligence
              </p>
              <p className="max-w-xl text-center text-2xs leading-relaxed text-text-muted sm:text-right">
                Not investment advice. All data from official U.S. government
                agencies. Proxy metrics are derived estimates, not official
                statistics.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
