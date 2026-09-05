"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useRegIntel } from "./data-provider";

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "changes", label: "Changes" },
  { id: "actions", label: "Actions" },
  { id: "regulations", label: "Regulations" },
  { id: "sources", label: "Sources" },
];

function getSectionFromHash(hash: string) {
  const value = hash.replace(/^#/, "");

  return navItems.some((item) => item.id === value) ? value : null;
}

function useWorkspaceSection(pathname: string) {
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "overview";
    }

    return getSectionFromHash(window.location.hash) ?? "overview";
  });
  const activeSectionRef = useRef(activeSection);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const handleHashChange = () => {
      const nextSection = getSectionFromHash(window.location.hash);

      if (nextSection) {
        setActiveSection(nextSection);
      }
    };

    const syncFromHash = window.requestAnimationFrame(handleHashChange);

    const elements = navItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      window.addEventListener("hashchange", handleHashChange);

      return () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
    }

    window.addEventListener("hashchange", handleHashChange);

    const observer = new IntersectionObserver(
      (entries) => {
        let nextActive = activeSectionRef.current;
        let highestRatio = 0;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          if (entry.intersectionRatio >= highestRatio) {
            highestRatio = entry.intersectionRatio;
            nextActive = entry.target.id;
          }
        });

        if (nextActive && nextActive !== activeSectionRef.current) {
          activeSectionRef.current = nextActive;
          setActiveSection(nextActive);

          if (window.location.hash !== `#${nextActive}`) {
            history.replaceState(null, "", `#${nextActive}`);
          }
        }
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.15, 0.3, 0.45, 0.6, 0.75],
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      window.cancelAnimationFrame(syncFromHash);
      window.removeEventListener("hashchange", handleHashChange);
      observer.disconnect();
    };
  }, [pathname]);

  return { activeSection, setActiveSection };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { backendStatus, loading, refreshData } = useRegIntel();
  const { activeSection, setActiveSection } = useWorkspaceSection(pathname);

  const navHref = useMemo(
    () => (sectionId: string) => (pathname === "/" ? `#${sectionId}` : `/#${sectionId}`),
    [pathname]
  );

  function scrollToSection(sectionId: string) {
    if (pathname !== "/") {
      return;
    }

    const element = document.getElementById(sectionId);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    setActiveSection(sectionId);
    history.replaceState(null, "", `#${sectionId}`);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f7f8fb_100%)] text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur">
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
                aria-label={loading ? "Refreshing workspace data" : "Refresh workspace data"}
                disabled={loading}
                title="Refresh workspace data"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:ring-offset-0 disabled:cursor-wait disabled:opacity-70"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <nav
          aria-label="Workspace sections"
          className="sticky top-[73px] z-10 border-b border-slate-200/80 bg-[rgba(250,250,249,0.92)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <span className="mr-1 hidden shrink-0 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 md:inline">
              Workspace
            </span>
            {navItems.map((item) => {
              const routeActive = item.id === "overview" ? pathname === "/" : pathname.startsWith(`/${item.id}`);
              const active = pathname === "/" ? activeSection === item.id : routeActive;
              const href = navHref(item.id);

              return (
                <div key={item.id} className="relative shrink-0">
                  {active ? (
                    <motion.span
                      layoutId="workspace-nav-pill"
                      className="absolute inset-0 rounded-full border border-slate-950 bg-slate-950 shadow-sm"
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    />
                  ) : null}
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    aria-label={`Go to ${item.label} section`}
                    onClick={(event) => {
                      if (pathname !== "/") {
                        return;
                      }

                      event.preventDefault();
                      scrollToSection(item.id);
                    }}
                    className={`relative inline-flex whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                      active
                        ? "border-transparent text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
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
