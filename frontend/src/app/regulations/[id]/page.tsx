"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Calendar,
  Hash,
  Activity,
} from "lucide-react";

const API_URL = "https://regintelx-backend.onrender.com";

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

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function RegulationPage({ params }: Props) {
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRegulation() {
      try {
        const { id } = await params;

        const response = await fetch(
          `${API_URL}/api/v1/regulations/${id}`
        );

        if (!response.ok) {
          throw new Error("Regulation not found");
        }

        const data = await response.json();
        setRegulation(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load regulation"
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegulation();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-slate-500">
            Loading regulation...
          </p>
        </div>
      </main>
    );
  }

  if (error || !regulation) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">
              Regulation unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error || "The requested regulation could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to command center
          </Link>

          <span className="text-xs font-medium text-slate-400">
            RegIntelX
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              Regulatory document
            </span>

            <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium capitalize text-green-700">
              {regulation.status}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
            {regulation.title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Review the regulatory metadata and intelligence available for this document.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <h2 className="font-semibold">
                    Regulation overview
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Key information extracted from the regulatory record.
                </p>
              </div>

              <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Hash size={14} />
                    Circular number
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {regulation.circular_number || "Not available"}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Calendar size={14} />
                    Published
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {regulation.published_date
                      ? new Date(regulation.published_date).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Calendar size={14} />
                    Effective
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {regulation.effective_date
                      ? new Date(regulation.effective_date).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <FileText size={14} />
                    Record status
                  </div>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                    {regulation.status}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <h2 className="font-semibold">
                  Regulatory summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A concise view of what this document contains.
                </p>
              </div>

              <div className="px-6 py-6">
                {regulation.summary ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {regulation.summary}
                  </p>
                ) : (
                  <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
                    No summary is currently available for this regulation.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                <h2 className="font-semibold">
                  Document access
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open the authoritative document directly from its source.
              </p>

              <a
                href={regulation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open original document
                <ExternalLink size={15} />
              </a>
            </section>

            <section className="rounded-2xl border bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                RegIntelX workflow
              </p>

              <p className="mt-2 text-sm font-medium leading-6">
                Regulation → Change detection → Impact → Compliance action
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                This document is the source layer for the intelligence and compliance workflow.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
