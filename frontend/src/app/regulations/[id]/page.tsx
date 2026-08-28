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
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
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

function formatDate(value: string | null) {
  if (!value) return "Not available";

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

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-9 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (error || !regulation) {
    return (
      <>
        <Link
          href="/regulations"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          <ArrowLeft size={16} />
          Back to regulations
        </Link>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <FileText size={19} className="text-slate-500" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            Regulation unavailable
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {error || "The requested regulation could not be found."}
          </p>

          <Link
            href="/regulations"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Return to regulations
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href="/regulations"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
      >
        <ArrowLeft size={16} />
        Back to regulations
      </Link>

      <div className="max-w-6xl">
        <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <FileText size={13} />
                Regulatory document
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 size={13} />
                {formatStatus(regulation.status)}
              </span>
            </div>

            <div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
                {regulation.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Source document captured by RegIntelX and used as
                the basis for regulatory change detection and
                downstream compliance analysis.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={regulation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open original document
                <ExternalLink size={15} />
              </a>

              <Link
                href="/changes"
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View detected changes
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <h2 className="font-semibold">
                      Regulation overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Key metadata extracted from this regulatory record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Hash size={14} />
                    Circular number
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {regulation.circular_number ||
                      "Not available"}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Calendar size={14} />
                    Published
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDate(regulation.published_date)}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Calendar size={14} />
                    Effective
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDate(regulation.effective_date)}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <ShieldCheck size={14} />
                    Record status
                  </div>

                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                    {formatStatus(regulation.status)}
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
                  A concise view of the regulatory content available
                  to the intelligence pipeline.
                </p>
              </div>

              <div className="px-6 py-6">
                {regulation.summary ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {regulation.summary}
                  </p>
                ) : (
                  <div className="rounded-xl border border-dashed bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-700">
                      Summary unavailable
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      RegIntelX has the regulatory record, but a
                      generated summary is not currently available.
                      Open the original document for the authoritative
                      text.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <h2 className="font-semibold">
                      Intelligence workflow
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      How this document connects to the compliance
                      workflow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      01
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Source
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Regulatory document is captured and indexed.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      02
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Change
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Material regulatory changes are detected.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      03
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Impact
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Affected business areas can be assessed.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      04
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      Action
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Compliance work is converted into trackable actions.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Next step
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      Review detected changes in the command center to
                      see their impact and the compliance actions
                      generated from them.
                    </p>

                    <Link
                      href="/changes"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Review changes
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
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
                Open the authoritative regulatory document directly
                from its registered source.
              </p>

              <a
                href={regulation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open source
                <ExternalLink size={15} />
              </a>
            </section>

            <section className="rounded-2xl border bg-slate-900 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-slate-300" />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  RegIntelX
                </p>
              </div>

              <h2 className="mt-3 text-lg font-semibold">
                From regulation to action
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                RegIntelX connects regulatory source material with
                detected changes, impact assessment, and actionable
                compliance work.
              </p>

              <Link
                href="/actions"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-slate-200"
              >
                Open compliance actions
                <ArrowUpRight size={14} />
              </Link>
            </section>

            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Record ID
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-600">
                {regulation.id}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
