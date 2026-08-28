"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { backendStatus, refreshData } = useRegIntel();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">RegIntelX</h1>
              <p className="text-xs text-slate-500">
                Regulatory Intelligence Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === "Connected"
                    ? "bg-green-500"
                    : backendStatus === "Checking..."
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              {backendStatus === "Connected"
                ? "System operational"
                : backendStatus}
            </div>

            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-[73px] z-10 border-b bg-slate-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-2">
          <span className="mr-2 hidden shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 md:inline">
            Workspace
          </span>
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                  active
                    ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {children}
        <footer className="py-8 text-center text-xs text-slate-400">
          RegIntelX · Regulatory intelligence and compliance tracking
        </footer>
      </div>
    </main>
  );
}
