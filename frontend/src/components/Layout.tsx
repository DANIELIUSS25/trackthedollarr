import { Link, Outlet, useLocation } from "react-router-dom";
import { Nav } from "./Nav";
import { useEffect, useState } from "react";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - desktop */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-border-subtle bg-surface-0 lg:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-2 border-b border-border-subtle px-5 py-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-accent-gold text-lg font-bold text-text-inverse">
              $
            </span>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              TrackTheDollar
            </span>
          </Link>
          <Nav />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle bg-surface-0/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-accent-gold text-sm font-bold text-text-inverse">
            $
          </span>
          <span className="text-sm font-bold text-text-primary">
            TrackTheDollar
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-text-secondary hover:bg-surface-3"
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
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-surface-0 pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <Nav />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
        <footer className="border-t border-border-subtle px-4 py-6 text-center text-xs text-text-tertiary">
          <p>
            TrackTheDollar.com — Public-source macroeconomic intelligence.
            Not investment advice. All data sourced from official U.S.
            government agencies. Proxy metrics are derived estimates, not
            official statistics.
          </p>
        </footer>
      </main>
    </div>
  );
}
