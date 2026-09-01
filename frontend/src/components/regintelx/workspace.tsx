"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useAnimatedNumber(value: number) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const duration = 550;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [prefersReducedMotion, value]);

  return prefersReducedMotion ? value : displayValue;
}

function AnimatedNumber({
  value,
  tone = "slate",
}: {
  value: number;
  tone?: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
  const displayValue = useAnimatedNumber(value);

  const toneClass = {
    slate: "text-slate-950",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
  }[tone];

  return (
    <span className={`tabular-nums tracking-tight ${toneClass}`}>
      {displayValue.toLocaleString()}
    </span>
  );
}

function RiskMeter({ value }: { value: number }) {
  const risk = clamp(Math.round(value), 0, 100);
  const tone = risk >= 75 ? "red" : risk >= 50 ? "amber" : "emerald";
  const trackClass = {
    red: "bg-red-100",
    amber: "bg-amber-100",
    emerald: "bg-emerald-100",
  }[tone];
  const barClass = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Risk score
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            <AnimatedNumber value={risk} tone={tone} /> / 100
          </p>
        </div>
        <Activity size={15} className={risk >= 75 ? "text-red-500" : risk >= 50 ? "text-amber-500" : "text-slate-400"} />
      </div>
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${trackClass}`}>
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${risk}%` }} />
      </div>
    </div>
  );
}

function WorkflowTrail({
  actionCount,
  impactLevel,
  changeType,
  regulationLabel,
}: {
  actionCount: number | null;
  impactLevel: string;
  changeType: string;
  regulationLabel: string;
}) {
  type WorkflowTone = "slate" | "blue" | "emerald" | "amber" | "red";

  const actionsText = actionCount === null ? "Tracked" : `${actionCount} linked`;
  const evidenceText = actionCount === null ? "Required" : actionCount > 0 ? "Tracked" : "Pending";

  const stages: Array<{
    label: string;
    value: string;
    icon: ReactNode;
    tone: WorkflowTone;
  }> = [
    {
      label: "Regulation",
      value: regulationLabel,
      icon: <FileText size={13} />,
      tone: "slate" as const,
    },
    {
      label: "Change",
      value: formatStatus(changeType),
      icon: <AlertTriangle size={13} />,
      tone: "amber" as const,
    },
    {
      label: "Impact",
      value: formatStatus(impactLevel),
      icon: <Activity size={13} />,
      tone: impactLevel.toLowerCase() === "high" || impactLevel.toLowerCase() === "critical" ? "red" : "blue",
    },
    {
      label: "Actions",
      value: actionsText,
      icon: <ClipboardCheck size={13} />,
      tone: actionCount === null ? "slate" : actionCount > 0 ? "emerald" : "slate",
    },
    {
      label: "Evidence",
      value: evidenceText,
      icon: <Database size={13} />,
      tone: actionCount === null ? "amber" : actionCount > 0 ? "emerald" : "amber",
    },
  ];

  const toneStyles = {
    slate: "border-slate-200 bg-white text-slate-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  } satisfies Record<WorkflowTone, string>;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex min-w-0 items-center gap-2">
            <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneStyles[stage.tone]}`}>
              {stage.icon}
              <span>{stage.label}</span>
            </div>
            <span className="max-w-[10rem] truncate text-[11px] text-slate-500">
              {stage.value}
            </span>
            {index < stages.length - 1 ? (
              <ArrowRight size={12} className="shrink-0 text-slate-300" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
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
  delay = 0,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "red";
  delay?: number;
}) {
  const toneMap = {
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-blue-200 bg-blue-50/60 text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50/60 text-slate-900",
    amber: "border-amber-200 bg-amber-50/70 text-slate-900",
    red: "border-red-200 bg-red-50/70 text-slate-900",
  }[tone];

  const animatedValue = typeof value === "number" ? (
    <AnimatedNumber value={value} tone={tone} />
  ) : (
    value
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay }}
      className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneMap}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {animatedValue}
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

  const cards = [
    {
      label: "Regulations",
      value: regulations.length,
      note: "Monitored source documents",
      icon: <FileText size={18} />,
      tone: "slate" as const,
    },
    {
      label: "High-impact changes",
      value: metrics.highImpactChanges,
      note: "Changes that need a close review",
      icon: <AlertTriangle size={18} />,
      tone: metrics.highImpactChanges > 0 ? ("red" as const) : ("slate" as const),
    },
    {
      label: "Open actions",
      value: metrics.openActions,
      note: `${metrics.urgentActions} urgent, ${metrics.completedActions} completed`,
      icon: <ClipboardCheck size={18} />,
      tone: metrics.openActions > 0 ? ("amber" as const) : ("emerald" as const),
    },
    {
      label: "Average risk",
      value: metrics.averageRisk,
      note: `Across ${metrics.openActions} active compliance actions`,
      icon: <Activity size={18} />,
      tone: metrics.averageRisk >= 75 ? ("red" as const) : metrics.averageRisk >= 50 ? ("amber" as const) : ("blue" as const),
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <KPI
          key={card.label}
          label={card.label}
          value={card.value}
          note={card.note}
          icon={card.icon}
          tone={card.tone}
          delay={index * 0.06}
        />
      ))}
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
            const domains = change.affected_domains || [];
            const confidenceText = confidenceLabel(change.ai_confidence);

            return (
              <motion.article
                key={change.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`px-5 py-5 sm:px-6 ${selected ? "bg-slate-50/80" : ""}`}
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
                        {confidenceText}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Regulation
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                        {relatedRegulation?.title ?? "Unlinked regulation"}
                      </h4>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        What changed
                      </p>
                      <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-800">
                        {change.change_summary}
                      </p>
                    </div>

                    {domains.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Affected domains
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {domains.map((domain) => (
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

                    <WorkflowTrail
                      regulationLabel={relatedRegulation?.circular_number ? `Circular ${relatedRegulation.circular_number}` : "Regulation"}
                      changeType={change.change_type}
                      impactLevel={change.impact_level}
                      actionCount={changeActionCount}
                    />

                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Impact summary
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {changeActionCount > 0
                          ? `${changeActionCount} linked compliance action${changeActionCount === 1 ? "" : "s"} already map to this change.`
                          : "No linked compliance actions are currently mapped to this change."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>Detected {formatDate(change.created_at)}</span>
                      <span>
                        {changeActionCount} related compliance action{changeActionCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-60">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Impact
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {change.impact_level} impact
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {changeActionCount > 0
                          ? `${changeActionCount} action${changeActionCount === 1 ? "" : "s"} linked`
                          : "No linked actions yet"}
                      </p>
                    </div>

                    {!compact ? (
                      <button
                        type="button"
                        onClick={() => onSelectedChange?.(selected ? null : change.id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition duration-200 focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                          selected
                            ? "border-slate-950 bg-slate-950 text-white shadow-sm hover:bg-slate-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
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
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                          <div className="min-w-0 space-y-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Why this matters
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-600">
                                The detected change is already linked to the actions below. Use them as the operational record for controls, evidence, and tracking.
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Impact
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {change.impact_level}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Linked actions
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {changeActionCount}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  AI confidence
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {confidenceText}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Linked compliance actions
                              </p>
                              <div className="mt-3 space-y-3">
                                {relatedActions.length === 0 ? (
                                  <p className="text-sm text-slate-500">
                                    No compliance actions are currently linked to this change.
                                  </p>
                                ) : (
                                  relatedActions.slice(0, 3).map((action) => (
                                    <div
                                      key={action.id}
                                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-slate-50"
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
                          </div>

                          <div className="space-y-3">
                            {relatedRegulation ? (
                              <Link
                                href={`/regulations/${relatedRegulation.id}`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                              >
                                Open regulation
                                <ArrowUpRight size={14} />
                              </Link>
                            ) : null}
                            <Link
                              href="/actions"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
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
  const [updatingMapId, setUpdatingMapId] = useState<string | null>(null);

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
            const isUpdating = updatingMapId === map.id;

            return (
              <motion.article
                key={map.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`px-5 py-5 sm:px-6 transition ${completed ? "bg-slate-50/60" : "hover:bg-slate-50/60"}`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
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

                    <h4 className={`text-lg font-semibold tracking-tight ${completed ? "text-slate-500 line-through" : "text-slate-950"}`}>
                      {map.title}
                    </h4>

                    <p className="max-w-4xl text-sm leading-7 text-slate-700">
                      {map.description}
                    </p>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
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
                          Originating change
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

                    <WorkflowTrail
                      regulationLabel={regulation?.circular_number ? `Circular ${regulation.circular_number}` : "Regulation"}
                      changeType={change?.change_type ?? "change"}
                      impactLevel={change?.impact_level ?? map.priority}
                      actionCount={null}
                    />

                    {selectedChange ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        Filtered by selected change
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-60">
                    <RiskMeter value={risk} />

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
                        disabled={isUpdating}
                        onClick={async () => {
                          const nextStatus = map.status === "pending" ? "in_progress" : "completed";
                          setUpdatingMapId(map.id);

                          try {
                            await updateMapStatus(map.id, nextStatus);
                          } finally {
                            setUpdatingMapId(null);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      >
                        {isUpdating
                          ? "Updating..."
                          : inProgress
                            ? "Mark complete"
                            : "Start action"}
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 size={14} />
                        Completed
                      </div>
                    )}

                    {regulation ? (
                      <Link
                        href={`/regulations/${regulation.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      >
                        Open regulation
                        <ArrowUpRight size={14} />
                      </Link>
                    ) : null}
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
  const searchActive = Boolean(query.trim());

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
      <div className={`border-b px-5 py-5 sm:px-6 ${searchActive ? "border-blue-200 bg-blue-50/40" : "border-slate-200"}`}>
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              Open intelligence
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              Original source
            </span>
            {searchActive ? (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Semantic search active
              </span>
            ) : null}
          </div>

          <div className="relative">
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

          <p className="text-xs text-slate-400">
            Semantic search returns the most relevant documents and highlights the evidence that matched.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
      ) : searchActive && semanticLoading ? (
        <div className="space-y-3 px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw size={15} className="animate-spin text-slate-400" />
            Searching semantic index...
          </div>
          <div className="h-20 animate-pulse rounded-2xl border border-blue-100 bg-blue-50/40" />
          <div className="h-20 animate-pulse rounded-2xl border border-blue-100 bg-blue-50/40" />
        </div>
      ) : visibleRegulations.length === 0 ? (
        <EmptyState
          icon={<FileText size={18} />}
          title={searchActive ? "No matching regulations found" : "No regulations available"}
          description={
            searchActive
              ? "Try a broader term, a circular number, or a source keyword."
              : "Once source documents are available, they will appear in this register."
          }
        />
      ) : (
        <div className="divide-y divide-slate-200">
          {visibleRegulations.map((regulation) => {
            const searchMode = searchActive;
            const relevance =
              regulation.similarity !== undefined ? Math.round(regulation.similarity * 100) : null;

            return (
              <motion.article
                key={regulation.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-6"
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

export function SourcesPanel({
  sources,
  loading,
}: {
  sources: Source[];
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
            return (
              <motion.article
                key={source.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="p-5 transition hover:bg-slate-50/60"
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
                      Source type / status
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
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
