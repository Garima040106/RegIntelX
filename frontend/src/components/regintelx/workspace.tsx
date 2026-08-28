"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { searchRegulations } from "@/lib/regintelx/api";
import { badgeClass, formatDate, formatStatus } from "@/lib/regintelx/format";
import type {
  ComplianceMap,
  Regulation,
  RegulationChange,
  Source,
} from "@/lib/regintelx/types";
import { useRegIntel } from "./data-provider";

function normalizeLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function confidenceLabel(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "AI confidence unavailable";
  }

  if (value <= 1) {
    return `${Math.round(value * 100)}% confidence`;
  }

  return `${Math.round(value)}% confidence`;
}

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function formatDueDate(value: string | null) {
  if (!value) return "No deadline provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value: string | null) {
  if (!value) return null;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return null;

  return Math.ceil((time - Date.now()) / (24 * 60 * 60 * 1000));
}

function changeRank(change: RegulationChange) {
  const impact = change.impact_level?.toLowerCase();

  if (impact === "high" || impact === "critical") return 0;
  if (impact === "medium") return 1;
  return 2;
}

function actionRank(map: ComplianceMap) {
  const priority = map.priority?.toLowerCase();
  const remaining = daysUntil(map.due_date);

  if (map.status !== "completed" && remaining !== null && remaining < 0) return 0;
  if (priority === "high" || priority === "critical") return 1;
  if (map.status === "in_progress") return 2;
  return 3;
}

function stateTone(value: string) {
  const normalized = value.toLowerCase();

  if (["high", "critical", "overdue", "blocked"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["completed", "active", "published", "low", "healthy"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["in_progress", "medium", "semantic", "search"].includes(normalized)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (["pending", "draft", "review", "urgent"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function WorkflowTrail({
  regulationLabel,
  changeLabel,
  actionLabel,
  evidenceLabel,
  regulationHref,
  changeHref,
}: {
  regulationLabel: string;
  changeLabel: string;
  actionLabel: string;
  evidenceLabel: string;
  regulationHref?: string;
  changeHref?: string;
}) {
  const stepClass =
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {regulationHref ? (
          <Link href={regulationHref} className={stepClass}>
            {regulationLabel}
          </Link>
        ) : (
          <span className={stepClass}>{regulationLabel}</span>
        )}
        <span className="text-slate-300">→</span>
        {changeHref ? (
          <Link href={changeHref} className={stepClass}>
            {changeLabel}
          </Link>
        ) : (
          <span className={stepClass}>{changeLabel}</span>
        )}
        <span className="text-slate-300">→</span>
        <span className={stepClass}>{actionLabel}</span>
        <span className="text-slate-300">→</span>
        <span className={stepClass}>{evidenceLabel}</span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                {icon}
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          </div>
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-950">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function KPI({
  label,
  value,
  note,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  note: string;
  icon: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
  const toneMap = {
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-blue-200 bg-blue-50/60 text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50/60 text-slate-900",
    amber: "border-amber-200 bg-amber-50/70 text-slate-900",
    red: "border-red-200 bg-red-50/70 text-slate-900",
  }[tone];

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneMap}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span className="rounded-lg border border-slate-200 bg-white/70 p-2 text-slate-500">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{note}</p>
    </motion.div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mb-8 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}

export function MetricsGrid() {
  const { regulations, metrics } = useRegIntel();

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KPI
        label="Regulations"
        value={regulations.length}
        note="Monitored source documents"
        icon={<FileText size={18} />}
      />
      <KPI
        label="High-impact changes"
        value={metrics.highImpactChanges}
        note="Changes that need a close review"
        icon={<AlertTriangle size={18} />}
        tone={metrics.highImpactChanges > 0 ? "red" : "slate"}
      />
      <KPI
        label="Open actions"
        value={metrics.openActions}
        note={`${metrics.urgentActions} urgent, ${metrics.completedActions} completed`}
        icon={<ClipboardCheck size={18} />}
        tone={metrics.openActions > 0 ? "amber" : "emerald"}
      />
      <KPI
        label="Average risk"
        value={metrics.averageRisk}
        note={`Across ${metrics.openActions} active compliance actions`}
        icon={<Activity size={18} />}
        tone={metrics.averageRisk >= 75 ? "red" : metrics.averageRisk >= 50 ? "amber" : "blue"}
      />
    </section>
  );
}

export function AttentionPanel() {
  const { metrics } = useRegIntel();
  const hasAttention =
    metrics.highImpactChanges > 0 || metrics.urgentActions > 0 || metrics.overdueActions > 0;

  return (
    <SectionCard
      title="Attention needed"
      description="Start with the highest-impact changes and anything time-sensitive in the compliance queue."
      icon={<AlertTriangle size={16} />}
    >
      <div className="px-5 py-5 sm:px-6">
        <div
          className={`rounded-2xl border px-4 py-4 ${
            hasAttention ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/60"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-950">
                {hasAttention ? "Review open risks first" : "No open attention items"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {hasAttention
                  ? "High-impact changes and urgent compliance work are surfaced first."
                  : "The current workload is stable and nothing appears overdue."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {metrics.highImpactChanges > 0 ? (
                <Link
                  href="/changes"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  {metrics.highImpactChanges} high-impact change{metrics.highImpactChanges === 1 ? "" : "s"}
                  <ArrowUpRight size={13} />
                </Link>
              ) : null}

              {metrics.overdueActions > 0 ? (
                <Link
                  href="/actions"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  {metrics.overdueActions} overdue action{metrics.overdueActions === 1 ? "" : "s"}
                  <ArrowUpRight size={13} />
                </Link>
              ) : null}

              {metrics.urgentActions > 0 ? (
                <Link
                  href="/actions"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100"
                >
                  {metrics.urgentActions} urgent action{metrics.urgentActions === 1 ? "" : "s"}
                  <ArrowUpRight size={13} />
                </Link>
              ) : null}

              {!hasAttention ? (
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={14} />
                  No outstanding items
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function SystemStatusPanel() {
  const { backendStatus } = useRegIntel();

  const tone =
    backendStatus === "Connected"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : backendStatus === "Checking..."
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-slate-500">
        <Activity size={15} />
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">System status</span>
      </div>
      <p className="mt-3 text-base font-semibold tracking-tight text-slate-950">
        {backendStatus === "Connected" ? "API operational" : backendStatus}
      </p>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
        {backendStatus === "Connected" ? "Connected" : backendStatus}
      </div>
    </section>
  );
}

export function ChangesPanel({
  changes,
  loading,
  selectedChange,
  onSelectedChange,
  compact = false,
}: {
  changes: RegulationChange[];
  loading: boolean;
  selectedChange?: string | null;
  onSelectedChange?: (id: string | null) => void;
  compact?: boolean;
}) {
  const { maps, regulations } = useRegIntel();

  const visibleChanges = useMemo(() => {
    const sorted = [...changes].sort((left, right) => changeRank(left) - changeRank(right));
    return compact ? sorted.slice(0, 4) : sorted;
  }, [changes, compact]);

  const regulationById = useMemo(
    () => new Map(regulations.map((regulation) => [regulation.id, regulation])),
    [regulations]
  );

  const countsByChange = useMemo(() => {
    return maps.reduce<Record<string, number>>((accumulator, map) => {
      accumulator[map.change_id] = (accumulator[map.change_id] || 0) + 1;
      return accumulator;
    }, {});
  }, [maps]);

  const actionsByChange = useMemo(() => {
    return maps.reduce<Record<string, ComplianceMap[]>>((accumulator, map) => {
      if (!accumulator[map.change_id]) {
        accumulator[map.change_id] = [];
      }

      accumulator[map.change_id].push(map);
      return accumulator;
    }, {});
  }, [maps]);

  return (
    <SectionCard
      title={compact ? "Recent regulatory changes" : "Regulatory changes workspace"}
      description="Review what changed, why it matters, and the compliance actions created from each change."
      icon={<AlertTriangle size={16} />}
      action={
        compact ? (
          <Link
            href="/changes"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            View all changes
            <ArrowUpRight size={13} />
          </Link>
        ) : selectedChange ? (
          <button
            type="button"
            onClick={() => onSelectedChange?.(null)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Show all changes
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
      ) : visibleChanges.length === 0 ? (
        <EmptyState
          icon={<FileText size={18} />}
          title="No regulatory changes detected"
          description="When the ingestion pipeline finds a new change, it will appear here with the associated impact and compliance actions."
        />
      ) : (
        <div className="divide-y divide-slate-200">
          {visibleChanges.map((change) => {
            const selected = selectedChange === change.id;
            const impactTone = stateTone(change.impact_level);
            const changeActionCount = countsByChange[change.id] || 0;
            const relatedActions = actionsByChange[change.id] || [];
            const relatedRegulation = regulationById.get(change.regulation_id);

            return (
              <motion.article
                key={change.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`px-5 py-5 sm:px-6 ${selected ? "bg-slate-50" : ""}`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${impactTone}`}>
                        {change.impact_level} impact
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${stateTone(change.change_type)}`}>
                        {normalizeLabel(change.change_type)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        {confidenceLabel(change.ai_confidence)}
                      </span>
                    </div>

                    <WorkflowTrail
                      regulationLabel="Regulation"
                      changeLabel="Change"
                      actionLabel={`${changeActionCount} action${changeActionCount === 1 ? "" : "s"}`}
                      evidenceLabel="Evidence"
                      regulationHref={relatedRegulation ? `/regulations/${relatedRegulation.id}` : undefined}
                      changeHref={selectedChange ? undefined : undefined}
                    />

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        What changed
                      </p>
                      <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-800">
                        {change.change_summary}
                      </p>
                    </div>

                    {change.affected_domains?.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Affected domains
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {change.affected_domains.map((domain) => (
                            <span
                              key={domain}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>Detected {formatDate(change.created_at)}</span>
                      <span>
                        {changeActionCount} related compliance action
                        {changeActionCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-56">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Impact
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {change.impact_level} impact
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {changeActionCount > 0
                          ? `${changeActionCount} action${changeActionCount === 1 ? "" : "s"} already linked`
                          : "No linked actions yet"}
                      </p>
                    </div>

                    {!compact ? (
                      <button
                        type="button"
                        onClick={() => onSelectedChange?.(selected ? null : change.id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                          selected
                            ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {selected ? "Hide compliance impact" : "View compliance impact"}
                        <ArrowUpRight size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {selected && !compact ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Compliance impact
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Review the linked actions below. Each action in the workspace points back to its originating regulation and the evidence it needs.
                            </p>

                            <div className="mt-4 space-y-3">
                              {relatedActions.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  No compliance actions are currently linked to this change.
                                </p>
                              ) : (
                                relatedActions.slice(0, 3).map((action) => (
                                  <div
                                    key={action.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <p className="font-medium text-slate-950">{action.title}</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                          {action.description}
                                        </p>
                                      </div>
                                      <Link
                                        href="/actions"
                                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                      >
                                        Open action workspace
                                        <ArrowUpRight size={13} />
                                      </Link>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:w-56">
                            {relatedRegulation ? (
                              <Link
                                href={`/regulations/${relatedRegulation.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                              >
                                Open regulation
                                <ArrowUpRight size={14} />
                              </Link>
                            ) : null}
                            <Link
                              href="/actions"
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                            >
                              Open compliance actions
                              <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export function ActionsPanel({
  maps,
  loading,
  selectedChange,
  compact = false,
}: {
  maps: ComplianceMap[];
  loading: boolean;
  selectedChange?: string | null;
  compact?: boolean;
}) {
  const { changes, regulations, metrics, updateMapStatus } = useRegIntel();

  const visibleMaps = useMemo(() => {
    const filtered = selectedChange ? maps.filter((map) => map.change_id === selectedChange) : maps;
    const sorted = [...filtered].sort((left, right) => actionRank(left) - actionRank(right));
    return compact ? sorted.slice(0, 4) : sorted;
  }, [compact, maps, selectedChange]);

  const regulationById = useMemo(
    () => new Map(regulations.map((regulation) => [regulation.id, regulation])),
    [regulations]
  );
  const changeById = useMemo(
    () => new Map(changes.map((change) => [change.id, change])),
    [changes]
  );

  return (
    <SectionCard
      title={compact ? "Recent compliance actions" : "Compliance action workspace"}
      description="Track priority, status, deadline, risk, and the evidence each action needs."
      icon={<ClipboardCheck size={16} />}
      action={
        compact ? (
          <Link
            href="/actions"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            View all actions
            <ArrowUpRight size={13} />
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {metrics.openActions} open
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {metrics.completedActions} completed
            </span>
          </div>
        )
      }
    >
      {loading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-100" />
          <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
      ) : visibleMaps.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={18} />}
          title={selectedChange ? "No actions for this change" : "No compliance actions to show"}
          description={
            selectedChange
              ? "That change has no linked actions in the current data set."
              : "Compliance actions will appear here once the pipeline generates work from detected regulatory changes."
          }
          action={
            selectedChange ? (
              <Link
                href="/changes"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Review changes
                <ArrowUpRight size={14} />
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-slate-200">
          {visibleMaps.map((map) => {
            const risk = Math.max(0, Math.min(100, Math.round(Number(map.risk_score || 0))));
            const completed = map.status === "completed";
            const inProgress = map.status === "in_progress";
            const priorityTone = stateTone(map.priority);
            const statusTone = stateTone(map.status);
            const remaining = daysUntil(map.due_date);
            const isOverdue = remaining !== null && remaining < 0 && !completed;
            const change = changeById.get(map.change_id);
            const regulation = regulationById.get(map.regulation_id);

            return (
              <motion.article
                key={map.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`px-5 py-5 sm:px-6 ${completed ? "bg-slate-50/60" : ""}`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-base font-semibold tracking-tight ${completed ? "text-slate-500 line-through" : "text-slate-950"}`}>
                        {map.title}
                      </h4>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${priorityTone}`}>
                        {normalizeLabel(map.priority)} priority
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone}`}>
                        {normalizeLabel(map.status)}
                      </span>
                      {isOverdue ? (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      ) : remaining !== null && remaining >= 0 && remaining <= 7 ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Due soon
                        </span>
                      ) : null}
                    </div>

                    <WorkflowTrail
                      regulationLabel="Regulation"
                      changeLabel="Change"
                      actionLabel="Compliance action"
                      evidenceLabel="Evidence"
                      regulationHref={regulation ? `/regulations/${regulation.id}` : undefined}
                      changeHref="/changes"
                    />

                    <p className="max-w-4xl text-sm leading-7 text-slate-700">
                      {map.description}
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Required evidence
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {map.required_evidence}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Originating change / regulation
                        </p>
                        <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                          {regulation ? (
                            <div>
                              <p className="font-medium text-slate-950">{regulation.title}</p>
                              <p className="text-slate-500">
                                {regulation.circular_number ? `Circular ${regulation.circular_number}` : "Circular number unavailable"}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-500">Regulation not linked in the current data.</p>
                          )}
                          {change ? (
                            <div>
                              <p className="text-slate-500">Triggered by: {change.change_summary}</p>
                              <Link
                                href="/changes"
                                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
                              >
                                View originating change
                                <ArrowUpRight size={13} />
                              </Link>
                            </div>
                          ) : (
                            <p className="text-slate-500">Change reference: {map.change_id}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedChange ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        Filtered by selected change
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-56">
                    <div className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${isOverdue ? "border-red-200 bg-red-50/70" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Risk score
                        </p>
                        <Activity size={15} className={risk >= 75 ? "text-red-500" : risk >= 50 ? "text-amber-500" : "text-slate-400"} />
                      </div>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">{risk}</p>
                        <span className="pb-1 text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${risk >= 75 ? "bg-red-500" : risk >= 50 ? "bg-amber-500" : "bg-slate-700"}`}
                          style={{ width: `${risk}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Deadline
                      </p>
                      <p className={`mt-2 text-sm font-medium ${isOverdue ? "text-red-700" : "text-slate-700"}`}>
                        {formatDueDate(map.due_date)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {remaining === null
                          ? "No due date recorded"
                          : isOverdue
                            ? `${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? "" : "s"} overdue`
                            : remaining === 0
                              ? "Due today"
                              : `${remaining} day${remaining === 1 ? "" : "s"} remaining`}
                      </p>
                    </div>

                    {!completed ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateMapStatus(
                            map.id,
                            map.status === "pending" ? "in_progress" : "completed"
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      >
                        {inProgress ? "Mark complete" : "Start action"}
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 size={14} />
                        Completed
                      </div>
                    )}

                    {regulation ? (
                      <Link
                        href={`/regulations/${regulation.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      >
                        Open regulation
                        <ArrowUpRight size={14} />
                      </Link>
                    ) : null}
                    <Link
                      href="/changes"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      View impact chain
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export function RegulationsPanel({
  regulations,
  loading,
  compact = false,
}: {
  regulations: Regulation[];
  loading: boolean;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<Regulation[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSemanticLoading(true);
        setSemanticResults(await searchRegulations(trimmed, compact ? 6 : 10));
      } catch (error) {
        console.error("Semantic search error:", error);
        setSemanticResults([]);
      } finally {
        setSemanticLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [compact, query]);

  const visibleRegulations = useMemo(() => {
    const source = query.trim() ? semanticResults : regulations;
    return source.slice(0, compact ? 5 : source.length);
  }, [compact, query, regulations, semanticResults]);

  return (
    <SectionCard
      title={compact ? "Regulations monitored" : "Regulatory document library"}
      description="Search by meaning, circular number, source material, or published text."
      icon={<Search size={16} />}
      action={
        compact ? (
          <Link
            href="/regulations"
            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:inline-flex"
          >
            Open register
          </Link>
        ) : null
      }
    >
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="relative max-w-3xl">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by concept, requirement, source, or circular number..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-12 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            aria-label="Semantic search regulations"
          />
          {semanticLoading ? (
            <RefreshCw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Semantic search returns the most relevant documents and highlights the evidence that matched.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
      ) : visibleRegulations.length === 0 ? (
        <EmptyState
          icon={<FileText size={18} />}
          title={query.trim() ? "No matching regulations found" : "No regulations available"}
          description={
            query.trim()
              ? "Try a broader term, a circular number, or a source keyword."
              : "Once source documents are available, they will appear in this register."
          }
        />
      ) : (
        <div className="divide-y divide-slate-200">
          {visibleRegulations.map((regulation) => {
            const searchMode = Boolean(query.trim());
            const relevance =
              regulation.similarity !== undefined ? Math.round(regulation.similarity * 100) : null;

            return (
              <motion.article
                key={regulation.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="px-5 py-5 sm:px-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Regulatory document
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(regulation.status)}`}>
                        {formatStatus(regulation.status)}
                      </span>
                      {searchMode && relevance !== null ? (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {relevance}% semantic relevance
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-base font-semibold tracking-tight text-slate-950">
                        {regulation.title}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          {regulation.circular_number ? `Circular ${regulation.circular_number}` : "Circular number unavailable"}
                        </span>
                        <span>Published {formatDate(regulation.published_date)}</span>
                        <span>Effective {formatDate(regulation.effective_date)}</span>
                        <span>Source {formatHost(regulation.source_url)}</span>
                      </div>
                    </div>

                    {searchMode && regulation.evidence ? (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                          Search evidence
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          {regulation.evidence.replace(/\s+/g, " ").trim()}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link
                      href={`/regulations/${regulation.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                      Open intelligence
                      <ArrowUpRight size={14} />
                    </Link>
                    <a
                      href={regulation.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                      Original source
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function relatedRegulationsForSource(source: Source, regulations: Regulation[]) {
  const sourceHost = formatHost(source.base_url);

  return regulations.filter((regulation) => {
    const regulationHost = formatHost(regulation.source_url);
    return regulationHost === sourceHost || regulation.source_url.startsWith(source.base_url);
  });
}

export function SourcesPanel({
  sources,
  regulations = [],
  loading,
}: {
  sources: Source[];
  regulations?: Regulation[];
  loading: boolean;
}) {
  return (
    <SectionCard
      title="Regulatory sources"
      description="Authorities and source systems that feed the intelligence workflow."
      icon={<Database size={16} />}
    >
      {loading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={18} />}
          title="No regulatory sources registered"
          description="Once source authorities are loaded, they will appear here with their activity status and monitored relationships."
        />
      ) : (
        <div className="grid divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          {sources.map((source) => {
            const relatedRegulations = relatedRegulationsForSource(source, regulations);

            return (
              <motion.article
                key={source.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold tracking-tight text-slate-950">
                      {source.name}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {source.authority}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${source.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                  >
                    {source.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Source type
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {normalizeLabel(source.source_type)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Source URL
                    </p>
                    <a
                      href={source.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                      {formatHost(source.base_url)}
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Monitored regulations
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {relatedRegulations.length}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {relatedRegulations.length > 0
                        ? `${relatedRegulations.slice(0, 2).map((regulation) => regulation.title).join(" · ")}${relatedRegulations.length > 2 ? " · …" : ""}`
                        : "No direct regulation match could be established from the current data."}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
