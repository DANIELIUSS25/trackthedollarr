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
    <div className="flex min-h-screen bg-terminal-black">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[240px] flex-shrink-0 lg:block">
        <div className="fixed top-0 flex h-screen w-[240px] flex-col border-r border-terminal-border bg-terminal-black">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 border-b border-terminal-border px-5 py-4"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-phosphor/70 bg-phosphor-dim" style={{ boxShadow: '0 0 6px rgba(0,255,65,0.15)' }}>
              <span className="font-mono text-sm font-black leading-none text-phosphor">$</span>
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-phosphor">
              TrackTheDollar
            </span>
          </Link>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto">
            <Nav />
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-terminal-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-phosphor">&gt;</span>
              <span className="text-2xs font-medium text-text-tertiary">
                FEEDS:
              </span>
              <span className="text-2xs font-medium text-phosphor">
                ACTIVE
              </span>
              <span className="inline-block w-1.5 h-3 bg-phosphor animate-cursor-blink" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-terminal-border bg-terminal-black px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-phosphor/70 bg-phosphor-dim">
            <span className="font-mono text-sm font-black leading-none text-phosphor">$</span>
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-phosphor">
            TrackTheDollar
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-text-tertiary transition-colors hover:text-phosphor"
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
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
            className="absolute inset-0 bg-terminal-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-terminal-border bg-terminal-black pt-14 animate-slide-in">
            <Nav />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
        <footer className="mt-8 border-t border-terminal-border">
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                TrackTheDollar.com
              </p>
              <p className="max-w-lg text-[10px] leading-relaxed text-text-muted sm:text-right">
                Not investment advice. All data from official U.S. government
                agencies. Proxy metrics are derived estimates.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
