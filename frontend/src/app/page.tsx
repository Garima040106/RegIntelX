"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Database,
  Activity,
  ExternalLink,
  RefreshCw,
  ClipboardCheck,
  AlertTriangle,
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

export default function Home() {
  const [sources, setSources] = useState<Source[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [maps, setMaps] = useState<ComplianceMap[]>([]);
  const [changes, setChanges] = useState<RegulationChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState("Checking...");

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
        throw new Error("Failed to load data");
      }

      const sourcesData = await sourcesResponse.json();
      const regulationsData = await regulationsResponse.json();
      const mapsData = await mapsResponse.json();
      const changesData = await changesResponse.json();

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
        throw new Error("Failed to update map status");
      }

      const updatedMap = await response.json();

      setMaps((currentMaps) =>
        currentMaps.map((map) =>
          map.id === mapId ? updatedMap : map
        )
      );
    } catch {
      alert("Failed to update compliance action.");
    }
  }

  const highImpactChanges = changes.filter(
    (change) => change.impact_level?.toLowerCase() === "high"
  ).length;

  const activeMaps = maps.filter(
    (map) => map.status !== "completed"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="text-xl font-semibold">RegIntelX</h1>
              <p className="text-xs text-slate-500">
                Regulatory Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendStatus === "Connected"
                  ? "bg-green-500"
                  : backendStatus === "Checking..."
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />

            Backend: {backendStatus}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Regulatory Intelligence
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Discover regulatory changes, assess their impact, and track
            compliance actions.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Regulatory Sources
              </span>
              <Database size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">
              {sources.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Connected sources
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Regulations
              </span>
              <FileText size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">
              {regulations.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Currently stored
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Regulatory Changes
              </span>
              <AlertTriangle size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">
              {changes.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {highImpactChanges} high impact
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Open Compliance Actions
              </span>
              <ClipboardCheck size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">
              {activeMaps}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Pending or in progress
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="font-semibold">
                Detected Regulatory Changes
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Changes detected between regulatory document versions.
              </p>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                Loading regulatory changes...
              </div>
            ) : changes.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No regulatory changes detected.
              </div>
            ) : (
              changes.map((change) => (
                <div
                  key={change.id}
                  className="px-6 py-5"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            change.impact_level?.toLowerCase() === "high"
                              ? "bg-red-50 text-red-700"
                              : change.impact_level?.toLowerCase() === "low"
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {change.impact_level} impact
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {change.change_type}
                        </span>
                      </div>

                      <p className="mt-3 font-medium">
                        {change.change_summary}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {change.affected_domains?.map((domain) => (
                          <span
                            key={domain}
                            className="rounded-md border bg-white px-2 py-1 text-xs text-slate-600"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <p>
                        {change.ai_confidence !== null
                          ? `AI confidence: ${change.ai_confidence}`
                          : "AI confidence unavailable"}
                      </p>

                      <p className="mt-1">
                        {new Date(
                          change.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h3 className="font-semibold">
              Compliance Actions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Action items generated from detected regulatory changes.
            </p>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                Loading compliance actions...
              </div>
            ) : maps.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No compliance actions generated.
              </div>
            ) : (
              maps.map((map) => (
                <div
                  key={map.id}
                  className="px-6 py-5"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">
                          {map.title}
                        </h4>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            map.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : map.status === "in_progress"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {map.status.replace("_", " ")}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            map.priority === "high"
                              ? "bg-red-50 text-red-700"
                              : map.priority === "low"
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {map.priority} priority
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl text-sm text-slate-600">
                        {map.description}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Evidence: {map.required_evidence}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">
                        Risk {map.risk_score}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Due{" "}
                        {map.due_date
                          ? new Date(
                              map.due_date
                            ).toLocaleDateString()
                          : "Not set"}
                      </p>

                      {map.status !== "completed" && (
                        <div className="mt-3 flex gap-2">
                          {map.status === "pending" && (
                            <button
                              onClick={() =>
                                updateMapStatus(
                                  map.id,
                                  "in_progress"
                                )
                              }
                              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              Start Review
                            </button>
                          )}

                          {map.status === "in_progress" && (
                            <button
                              onClick={() =>
                                updateMapStatus(
                                  map.id,
                                  "completed"
                                )
                              }
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h3 className="font-semibold">
              Regulatory Sources
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Sources currently registered in RegIntelX.
            </p>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No regulatory sources found.
              </div>
            ) : (
              sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between px-6 py-5"
                >
                  <div>
                    <h4 className="font-medium">
                      {source.name}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {source.authority}
                    </p>
                  </div>

                  <a
                    href={source.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Visit source
                    <ExternalLink size={15} />
                  </a>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h3 className="font-semibold">
              Regulations
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Regulatory documents currently stored in RegIntelX.
            </p>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                Loading regulations...
              </div>
            ) : regulations.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No regulations found.
              </div>
            ) : (
              regulations.map((regulation) => (
                <div
                  key={regulation.id}
                  className="flex items-center justify-between px-6 py-5"
                >
                  <div>
                    <h4 className="font-medium">
                      {regulation.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {regulation.circular_number
                        ? `Circular: ${regulation.circular_number}`
                        : "Circular number not available"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Status: {regulation.status}
                    </p>
                  </div>

                  <Link
                    href={`/regulations/${regulation.id}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    View document
                    <ExternalLink size={15} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
