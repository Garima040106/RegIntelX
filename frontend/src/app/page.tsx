"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Database,
  Activity,
  ExternalLink,
  RefreshCw,
  ClipboardCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const API_URL = "https://regintelx-backend.onrender.com";

type Source = {
  id: string;
  name: string;
  authority: string;
  base_url: string;
  source_type: string;
  is_active: boolean;
};

type Regulation = {
  id: string;
  title: string;
  circular_number: string | null;
  published_date: string | null;
  effective_date: string | null;
  source_url: string;
  status: string;
  summary?: string | null;
};

type ComplianceMap = {
  id: string;
  regulation_id: string;
  change_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  risk_score: number;
  required_evidence: string;
  created_at: string;
  updated_at: string;
};

type RegulationChange = {
  id: string;
  regulation_id: string;
  previous_version_id: string | null;
  new_version_id: string;
  change_type: string;
  change_summary: string;
  impact_level: string;
  affected_domains: string[];
  ai_confidence: number | null;
  created_at: string;
};

function badgeClass(value: string) {
  const normalized = value?.toLowerCase();

  if (
    normalized === "high" ||
    normalized === "critical"
  ) {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (
    normalized === "completed" ||
    normalized === "low"
  ) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (
    normalized === "in_progress" ||
    normalized === "medium"
  ) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function Home() {
  const [sources, setSources] = useState<Source[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [maps, setMaps] = useState<ComplianceMap[]>([]);
  const [changes, setChanges] = useState<RegulationChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [search, setSearch] = useState("");
  const [semanticResults, setSemanticResults] = useState<Regulation[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [selectedChange, setSelectedChange] =
    useState<string | null>(null);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSemanticResults([]);
      setSemanticLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSemanticLoading(true);

        const response = await fetch(
          `${API_URL}/api/v1/regulations/semantic-search?q=${encodeURIComponent(query)}&limit=8`
        );

        if (!response.ok) {
          throw new Error("Semantic search failed");
        }

        const data = await response.json();

        setSemanticResults(
          data.map((item: any) => ({
            id: item.regulation_id,
            title: item.title,
            circular_number: item.circular_number,
            published_date: item.published_date,
            effective_date: item.effective_date,
            source_url: item.source_url,
            status: "active",
            summary: item.evidence,
          }))
        );
      } catch (error) {
        console.error("Semantic search error:", error);
        setSemanticResults([]);
      } finally {
        setSemanticLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  async function loadData() {
    try {
      setLoading(true);

      const [
        sourcesResponse,
        regulationsResponse,
        mapsResponse,
        changesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/v1/sources`),
        fetch(`${API_URL}/api/v1/regulations`),
        fetch(`${API_URL}/api/v1/maps`),
        fetch(`${API_URL}/api/v1/changes`),
      ]);

      if (
        !sourcesResponse.ok ||
        !regulationsResponse.ok ||
        !mapsResponse.ok ||
        !changesResponse.ok
      ) {
        throw new Error("Failed to load API data");
      }

      const [
        sourcesData,
        regulationsData,
        mapsData,
        changesData,
      ] = await Promise.all([
        sourcesResponse.json(),
        regulationsResponse.json(),
        mapsResponse.json(),
        changesResponse.json(),
      ]);

      setSources(
        Array.isArray(sourcesData)
          ? sourcesData
          : sourcesData.items ?? []
      );

      setRegulations(
        Array.isArray(regulationsData)
          ? regulationsData
          : regulationsData.items ?? []
      );

      setMaps(
        Array.isArray(mapsData)
          ? mapsData
          : mapsData.items ?? []
      );

      setChanges(
        Array.isArray(changesData)
          ? changesData
          : changesData.items ?? []
      );

      setBackendStatus("Connected");
    } catch {
      setBackendStatus("Unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateMapStatus(
    mapId: string,
    status: string
  ) {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/maps/${mapId}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedMap = await response.json();

      setMaps((current) =>
        current.map((map) =>
          map.id === mapId ? updatedMap : map
        )
      );
    } catch {
      alert("Failed to update compliance action.");
    }
  }

  const highImpactChanges = changes.filter(
    (change) =>
      change.impact_level?.toLowerCase() === "high"
  ).length;

  const openActions = maps.filter(
    (map) => map.status !== "completed"
  ).length;

  const completedActions = maps.filter(
    (map) => map.status === "completed"
  ).length;

  const averageRisk = maps.length
    ? Math.round(
        maps.reduce(
          (sum, map) => sum + Number(map.risk_score || 0),
          0
        ) / maps.length
      )
    : 0;

  const filteredRegulations = useMemo(() => {
    if (search.trim()) {
      return semanticResults.slice(0, 8);
    }

    return regulations.slice(0, 8);
  }, [regulations, search, semanticResults]);

  const visibleMaps = selectedChange
    ? maps.filter(
        (map) => map.change_id === selectedChange
      )
    : maps;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">
                RegIntelX
              </h1>
              <p className="text-xs text-slate-500">
                Regulatory Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendStatus === "Connected"
                    ? "bg-green-500"
                    : backendStatus === "Checking..."
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              {backendStatus}
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-[73px] z-10 border-b bg-slate-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-2">
          <a
            href="#changes"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Changes
          </a>
          <a
            href="#actions"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Compliance actions
          </a>
          <a
            href="#regulations"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Regulations
          </a>
          <a
            href="#sources"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Sources
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Compliance intelligence
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Regulatory command center
              </h2>

              <p className="mt-2 max-w-2xl text-slate-600">
                Detect regulatory changes, understand their impact,
                and turn them into trackable compliance actions.
              </p>
            </div>

            <div className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Activity size={15} />
                System status
              </div>
              <p className="mt-1 font-medium">
                {backendStatus === "Connected"
                  ? "API operational"
                  : backendStatus}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Regulations
              </span>
              <FileText size={19} className="text-slate-400" />
            </div>
            <p className="text-3xl font-semibold">
              {regulations.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Documents being monitored
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Changes detected
              </span>
              <AlertTriangle size={19} className="text-slate-400" />
            </div>
            <p className="text-3xl font-semibold">
              {changes.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {highImpactChanges} high impact
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Open actions
              </span>
              <ClipboardCheck size={19} className="text-slate-400" />
            </div>
            <p className="text-3xl font-semibold">
              {openActions}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {completedActions} completed
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Average risk
              </span>
              <Activity size={19} className="text-slate-400" />
            </div>
            <p className="text-3xl font-semibold">
              {averageRisk}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Across compliance actions
            </p>
          </div>
        </section>

        <section id="changes" className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-slate-500" />
                  <h3 className="font-semibold">
                    Regulatory changes
                  </h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  See what changed, assess the impact, and review the actions it created.
                </p>
              </div>

              {selectedChange && (
                <button
                  onClick={() => setSelectedChange(null)}
                  className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-slate-50"
                >
                  Show all changes
                </button>
              )}
            </div>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                Loading regulatory changes...
              </div>
            ) : changes.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                No regulatory changes detected.
              </div>
            ) : (
              changes.map((change) => {
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
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                              change.impact_level
                            )}`}
                          >
                            {change.impact_level} impact
                          </span>

                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                            {formatStatus(change.change_type)}
                          </span>

                          {change.affected_domains?.slice(0, 4).map(
                            (domain) => (
                              <span
                                key={domain}
                                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500"
                              >
                                {domain}
                              </span>
                            )
                          )}
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            What changed
                          </p>
                          <p className="mt-1 max-w-3xl font-medium leading-6 text-slate-900">
                            {change.change_summary}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span>
                            {change.ai_confidence !== null
                              ? `AI confidence: ${change.ai_confidence}`
                              : "AI confidence unavailable"}
                          </span>
                          <span>
                            Detected{" "}
                            {new Date(
                              change.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedChange(
                            isSelected ? null : change.id
                          )
                        }
                        className="flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-white"
                      >
                        {isSelected
                          ? "Hide actions"
                          : "View affected actions"}
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="actions" className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-slate-500" />
                  <h3 className="font-semibold">
                    Compliance actions
                  </h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Review and track the actions created from regulatory changes.
                </p>
              </div>

              {selectedChange && (
                <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  Showing actions for selected change
                </span>
              )}
            </div>
          </div>

          <div className="divide-y">
            {visibleMaps.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                Select a regulatory change above to view its compliance actions.
              </div>
            ) : (
              visibleMaps.map((map) => (
                <div
                  key={map.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">
                          {map.title}
                        </h4>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                            map.priority
                          )}`}
                        >
                          {formatStatus(map.priority)}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                            map.status
                          )}`}
                        >
                          {formatStatus(map.status)}
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {map.description}
                      </p>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Required evidence
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-700">
                          {map.required_evidence}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:min-w-40 lg:items-end">
                      <div className="rounded-xl border bg-white px-4 py-3 text-right">
                        <p className="text-xs text-slate-500">
                          Risk score
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                          {Math.round(Number(map.risk_score || 0))}
                        </p>
                      </div>

                      {map.due_date && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            Deadline
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {new Date(map.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {map.status !== "completed" && (
                        <button
                          onClick={() =>
                            updateMapStatus(
                              map.id,
                              map.status === "pending"
                                ? "in_progress"
                                : "completed"
                            )
                          }
                          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 lg:w-auto"
                        >
                          {map.status === "pending"
                            ? "Start action"
                            : "Mark complete"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="regulations" className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  Regulatory intelligence
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Search regulations by meaning, requirement, or circular number.
                </p>
              </div>

              {search.trim() && !semanticLoading && (
                <span className="hidden rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-500 sm:inline-flex">
                  {filteredRegulations.length} results
                </span>
              )}
            </div>

            <div className="relative mt-5 max-w-3xl">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
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
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="font-medium">
                      {regulation.title}
                    </h4>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        {regulation.circular_number
                          ? `Circular ${regulation.circular_number}`
                          : "Circular number unavailable"}
                      </span>

                      {regulation.published_date && (
                        <span>
                          Published{" "}
                          {new Date(
                            regulation.published_date
                          ).toLocaleDateString()}
                        </span>
                      )}

                      <span>
                        Status: {regulation.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/regulations/${regulation.id}`}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      View document
                      <ExternalLink size={14} />
                    </Link>

                    <a
                      href={regulation.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
                    >
                      Source
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="sources" className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h3 className="font-semibold">
              Regulatory sources
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Authorities currently registered in RegIntelX.
            </p>
          </div>

          <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium">
                      {source.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {source.authority}
                    </p>
                  </div>

                  <span className="rounded-full border border-green-100 bg-green-50 px-2 py-1 text-xs text-green-700">
                    Active
                  </span>
                </div>

                <a
                  href={source.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  Visit source
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          RegIntelX · Regulatory intelligence and compliance
          tracking
        </footer>
      </div>
    </main>
  );
}
