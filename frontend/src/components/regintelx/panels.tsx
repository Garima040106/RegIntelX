"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { searchRegulations } from "@/lib/regintelx/api";
import { badgeClass, formatStatus } from "@/lib/regintelx/format";
import type {
  ComplianceMap,
  Regulation,
  RegulationChange,
  Source,
} from "@/lib/regintelx/types";
import { useRegIntel } from "./data-provider";

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
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
    <section className="mb-8">
      <p className="mb-2 text-sm font-medium text-slate-500">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
    </section>
  );
}

export function MetricsGrid() {
  const { regulations, changes, maps, metrics } = useRegIntel();

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Regulations"
        value={regulations.length}
        note="Documents being monitored"
        icon={<FileText size={19} />}
      />
      <MetricCard
        label="Changes detected"
        value={changes.length}
        note={`${metrics.highImpactChanges} high impact`}
        icon={<AlertTriangle size={19} />}
      />
      <MetricCard
        label="Open actions"
        value={metrics.openActions}
        note={`${metrics.completedActions} completed`}
        icon={<ClipboardCheck size={19} />}
      />
      <MetricCard
        label="Average risk"
        value={metrics.averageRisk}
        note={`Across ${maps.length} compliance actions`}
        icon={<Activity size={19} />}
      />
    </section>
  );
}

export function AttentionPanel() {
  const { metrics } = useRegIntel();

  return (
    <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-500" />
            <h3 className="font-semibold">Attention needed</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Start with high-impact changes and outstanding compliance actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {metrics.highImpactChanges > 0 && (
            <Link
              href="/changes"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              {metrics.highImpactChanges} high-impact change
              {metrics.highImpactChanges === 1 ? "" : "s"}
              <ArrowUpRight size={13} />
            </Link>
          )}

          {metrics.openActions > 0 && (
            <Link
              href="/actions"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              {metrics.openActions} open action
              {metrics.openActions === 1 ? "" : "s"}
              <ArrowUpRight size={13} />
            </Link>
          )}

          {metrics.highImpactChanges === 0 && metrics.openActions === 0 && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <CheckCircle2 size={14} />
              No outstanding items
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function SystemStatusPanel() {
  const { backendStatus } = useRegIntel();

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Activity size={15} />
        System status
      </div>
      <p className="mt-1 font-medium">
        {backendStatus === "Connected" ? "API operational" : backendStatus}
      </p>
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
  const visibleChanges = compact ? changes.slice(0, 4) : changes;

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-slate-500" />
              <h3 className="font-semibold">
                {compact ? "Recent regulatory changes" : "Regulatory changes"}
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              See what changed, assess impact, and review created actions.
            </p>
          </div>

          {compact ? (
            <Link
              href="/changes"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              View all changes
              <ArrowUpRight size={13} />
            </Link>
          ) : selectedChange ? (
            <button
              onClick={() => onSelectedChange?.(null)}
              className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Show all changes
            </button>
          ) : null}
        </div>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Loading regulatory changes...
          </div>
        ) : visibleChanges.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No regulatory changes detected.
          </div>
        ) : (
          visibleChanges.map((change) => {
            const isSelected = selectedChange === change.id;

            return (
              <div
                key={change.id}
                className={`px-6 py-5 transition ${
                  isSelected ? "bg-slate-50" : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(change.impact_level)}`}
                      >
                        {change.impact_level} impact
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                        {formatStatus(change.change_type)}
                      </span>
                      {change.affected_domains?.slice(0, 4).map((domain) => (
                        <span
                          key={domain}
                          className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                      What changed
                    </p>
                    <p className="mt-1 max-w-3xl font-medium leading-6 text-slate-900">
                      {change.change_summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        {change.ai_confidence !== null
                          ? `AI confidence: ${change.ai_confidence}`
                          : "AI confidence unavailable"}
                      </span>
                      <span>
                        Detected{" "}
                        {new Date(change.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!compact && (
                    <div className="flex shrink-0 flex-col items-stretch gap-2 lg:min-w-44 lg:items-end">
                      <div className="rounded-xl border bg-white px-4 py-3 lg:text-right">
                        <p className="text-xs text-slate-400">Impact</p>
                        <p className="mt-1 text-sm font-semibold">
                          {change.impact_level} impact
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {change.affected_domains?.length || 0} affected domains
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          onSelectedChange?.(isSelected ? null : change.id)
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-slate-200 ${
                          isSelected
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? "Hide actions" : "View affected actions"}
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
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
  const { metrics, updateMapStatus } = useRegIntel();
  const visibleMaps = compact ? maps.slice(0, 4) : maps;

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-slate-500" />
              <h3 className="font-semibold">
                {compact ? "Recent compliance actions" : "Compliance actions"}
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Turn detected regulatory changes into accountable, trackable work.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {metrics.openActions} open
            </span>
            <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {metrics.completedActions} completed
            </span>
            {compact && (
              <Link
                href="/actions"
                className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                View all
              </Link>
            )}
            {selectedChange && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                Filtered by change
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Loading compliance actions...
          </div>
        ) : visibleMaps.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border bg-slate-50">
              <ClipboardCheck size={19} className="text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">
              No compliance actions to show
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Select a regulatory change to see actions generated from its
              impact assessment.
            </p>
          </div>
        ) : (
          visibleMaps.map((map) => {
            const risk = Math.round(Number(map.risk_score || 0));
            const isCompleted = map.status === "completed";
            const isInProgress = map.status === "in_progress";

            return (
              <div
                key={map.id}
                className={`px-6 py-6 transition ${
                  isCompleted ? "bg-slate-50/50" : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`font-medium ${
                          isCompleted
                            ? "text-slate-500 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {map.title}
                      </h4>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(map.priority)}`}
                      >
                        {formatStatus(map.priority)} priority
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(map.status)}`}
                      >
                        {formatStatus(map.status)}
                      </span>
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {map.description}
                    </p>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-slate-400" />
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Required evidence
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {map.required_evidence}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-48">
                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Risk score</p>
                        <Activity size={15} className="text-slate-400" />
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-2xl font-semibold">{risk}</p>
                        <span className="pb-1 text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{
                            width: `${Math.min(Math.max(risk, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {map.due_date && (
                      <div className="rounded-xl border bg-white p-4">
                        <p className="text-xs text-slate-400">Deadline</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {new Date(map.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {!isCompleted ? (
                      <button
                        onClick={() =>
                          updateMapStatus(
                            map.id,
                            map.status === "pending"
                              ? "in_progress"
                              : "completed"
                          )
                        }
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      >
                        {isInProgress ? "Mark complete" : "Start action"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
                        <CheckCircle2 size={14} />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
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
  const [search, setSearch] = useState("");
  const [semanticResults, setSemanticResults] = useState<Regulation[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSemanticLoading(true);
        setSemanticResults(await searchRegulations(query));
      } catch (error) {
        console.error("Semantic search error:", error);
        setSemanticResults([]);
      } finally {
        setSemanticLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredRegulations = useMemo(() => {
    if (search.trim()) return semanticResults.slice(0, compact ? 5 : 12);
    return regulations.slice(0, compact ? 5 : regulations.length);
  }, [compact, regulations, search, semanticResults]);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              {compact ? "Regulations monitored" : "Regulatory intelligence"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Search regulations by meaning, requirement, or circular number.
            </p>
          </div>

          {compact ? (
            <Link
              href="/regulations"
              className="hidden rounded-lg border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200 sm:inline-flex"
            >
              Open register
            </Link>
          ) : search.trim() && !semanticLoading ? (
            <span className="hidden rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-500 sm:inline-flex">
              {filteredRegulations.length} results
            </span>
          ) : null}
        </div>

        <div className="relative mt-5 max-w-3xl">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);

              if (!value.trim()) {
                setSemanticResults([]);
                setSemanticLoading(false);
              }
            }}
            placeholder="Search by concept, requirement, or circular number..."
            className="w-full rounded-xl border bg-white py-3.5 pl-10 pr-12 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
          {semanticLoading && (
            <RefreshCw
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
            />
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Semantic search understands regulatory meaning, not just exact words.
        </p>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            Loading regulations...
          </div>
        ) : filteredRegulations.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            No matching regulations found.
          </div>
        ) : (
          filteredRegulations.map((regulation) => (
            <div
              key={regulation.id}
              className="px-6 py-5 transition hover:bg-slate-50/60"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Regulatory document
                    </span>
                    <span className="rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700">
                      {regulation.status}
                    </span>
                    {search.trim() && regulation.similarity !== undefined && (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {(regulation.similarity * 100).toFixed(1)}% relevant
                      </span>
                    )}
                  </div>

                  <h4 className="mt-3 text-base font-semibold text-slate-900">
                    {regulation.title}
                  </h4>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>
                      {regulation.circular_number
                        ? `Circular ${regulation.circular_number}`
                        : "Circular number unavailable"}
                    </span>
                    {regulation.published_date && (
                      <span>
                        Published{" "}
                        {new Date(regulation.published_date).toLocaleDateString()}
                      </span>
                    )}
                    {regulation.effective_date && (
                      <span>
                        Effective{" "}
                        {new Date(regulation.effective_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {search.trim() && regulation.evidence && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                        Search evidence
                      </p>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">
                        {regulation.evidence.replace(/\s+/g, " ").trim()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <Link
                    href={`/regulations/${regulation.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    Open intelligence
                    <ArrowUpRight size={14} />
                  </Link>
                  <a
                    href={regulation.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    Original source
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
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
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-slate-500" />
          <div>
            <h3 className="font-semibold">Regulatory sources</h3>
            <p className="mt-1 text-sm text-slate-500">
              Authorities currently registered in RegIntelX.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-slate-500">
          Loading regulatory sources...
        </div>
      ) : sources.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">
          No regulatory sources registered.
        </div>
      ) : (
        <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {sources.map((source) => (
            <div key={source.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium">{source.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {source.authority}
                  </p>
                </div>
                <span className="rounded-full border border-green-100 bg-green-50 px-2 py-1 text-xs text-green-700">
                  {source.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                {formatStatus(source.source_type)}
              </p>

              <a
                href={source.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Visit source
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
