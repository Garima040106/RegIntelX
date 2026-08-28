"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useRegIntel } from "./data-provider";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/changes", label: "Changes" },
  { href: "/actions", label: "Actions" },
  { href: "/regulations", label: "Regulations" },
  { href: "/sources", label: "Sources" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { backendStatus, refreshData } = useRegIntel();

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-950 text-white shadow-sm">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                  RegIntelX
                </h1>
                <p className="text-xs text-slate-500">
                  Regulatory intelligence command center
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    backendStatus === "Connected"
                      ? "bg-emerald-500"
                      : backendStatus === "Checking..."
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
                {backendStatus === "Connected"
                  ? "System operational"
                  : backendStatus}
              </div>

              <button
                type="button"
                onClick={refreshData}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:ring-offset-0"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <nav className="sticky top-[73px] z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <span className="mr-1 hidden shrink-0 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 md:inline">
              Workspace
            </span>
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          <footer className="py-8 text-center text-xs text-slate-400">
            RegIntelX · Regulatory intelligence and compliance tracking
          </footer>
        </div>
      </main>
    </MotionConfig>
  );
}
