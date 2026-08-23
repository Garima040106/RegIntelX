"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Database,
  Activity,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://regintelx-backend.onrender.com";

type Source = {
  id: string;
  name: string;
  authority: string;
  base_url: string;
  source_type: string;
  is_active: boolean;
};

export default function Home() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  async function loadSources() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/v1/sources`);

      if (!response.ok) {
        throw new Error("Failed to load sources");
      }

      const data = await response.json();

      setSources(Array.isArray(data) ? data : data.items ?? []);
      setBackendStatus("Connected");
    } catch {
      setBackendStatus("Unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

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
            Discover, ingest and track regulatory documents from trusted
            sources.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Regulatory Sources</span>
              <Database size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">{sources.length}</p>
            <p className="mt-1 text-sm text-slate-500">
              Connected sources
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Regulations</span>
              <FileText size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">2</p>
            <p className="mt-1 text-sm text-slate-500">
              Currently stored
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">System Status</span>
              <Activity size={20} className="text-slate-400" />
            </div>

            <p className="text-3xl font-semibold">Live</p>
            <p className="mt-1 text-sm text-slate-500">
              Backend deployed on Render
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="font-semibold">Regulatory Sources</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sources currently registered in RegIntelX.
              </p>
            </div>

            <button
              onClick={loadSources}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
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
                    <h4 className="font-medium">{source.name}</h4>
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
      </div>
    </main>
  );
}
