"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { useRegIntel } from "@/components/regintelx/data-provider";
import { ActionsPanel, ChangesPanel } from "@/components/regintelx/workspace";
import { fetchRegulation } from "@/lib/regintelx/api";
import { formatDate, formatStatus } from "@/lib/regintelx/format";
import type { Regulation, Source } from "@/lib/regintelx/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function matchSource(regulationSourceUrl: string, sources: Source[]) {
  try {
    const regulationHost = new URL(regulationSourceUrl).hostname.replace(/^www\./, "");

    return sources.find((source) => {
      try {
        const sourceHost = new URL(source.base_url).hostname.replace(/^www\./, "");
        return sourceHost === regulationHost || regulationSourceUrl.startsWith(source.base_url);
      } catch {
        return false;
      }
    });
  } catch {
    return undefined;
  }
}

export default function RegulationPage({ params }: Props) {
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { changes, maps, sources } = useRegIntel();

  useEffect(() => {
    async function loadRegulation() {
      try {
        const { id } = await params;
        setRegulation(await fetchRegulation(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load regulation");
      } finally {
        setLoading(false);
      }
    }

    void loadRegulation();
  }, [params]);

  const matchedSource = useMemo(
    () => (regulation ? matchSource(regulation.source_url, sources) : undefined),
    [regulation, sources]
  );

  const relatedChanges = useMemo(
    () => changes.filter((change) => change.regulation_id === regulation?.id),
    [changes, regulation?.id]
  );

  const relatedActions = useMemo(
    () => maps.filter((map) => map.regulation_id === regulation?.id),
    [maps, regulation?.id]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          <ArrowLeft size={16} />
          Back to regulations
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <FileText size={19} className="text-slate-500" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Regulation unavailable
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {error || "The requested regulation could not be found."}
          </p>

          <Link
            href="/regulations"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
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
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
      >
        <ArrowLeft size={16} />
        Back to regulations
      </Link>

      <div className="max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <FileText size={13} />
                  Regulatory document
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={13} />
                  {formatStatus(regulation.status)}
                </span>
                {matchedSource ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Source: {matchedSource.name}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {regulation.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  This page shows the regulation record, the source it came from, and the downstream changes and compliance actions that RegIntelX can currently prove.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={regulation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Open original document
                  <ExternalLink size={15} />
                </a>

                <Link
                  href="/changes"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  View detected changes
                  <ArrowUpRight size={15} />
                </Link>
                {relatedActions.length > 0 ? (
                  <Link
                    href="/actions"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    View related actions
                    <ArrowUpRight size={15} />
                  </Link>
                ) : null}
              </div>
            </div>

            <aside className="grid gap-3 sm:grid-cols-2 xl:w-[28rem] xl:grid-cols-1">
              <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Source
                </p>
                <p className="mt-2 text-sm font-medium text-slate-950">
                  {matchedSource ? matchedSource.name : formatHost(regulation.source_url)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {matchedSource ? matchedSource.authority : "No direct source record matched from the current data."}
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Record ID
                </p>
                <p className="mt-2 break-all font-mono text-xs text-slate-600">
                  {regulation.id}
                </p>
              </section>
            </aside>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <h2 className="font-semibold tracking-tight text-slate-950">
                      Regulation metadata
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Key fields available for the document record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <Hash size={14} />
                    Circular number
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {regulation.circular_number || "Not available"}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <Calendar size={14} />
                    Published
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {formatDate(regulation.published_date)}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <Calendar size={14} />
                    Effective
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {formatDate(regulation.effective_date)}
                  </p>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <ShieldCheck size={14} />
                    Record status
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {formatStatus(regulation.status)}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold tracking-tight text-slate-950">
                  Summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The best available summary from the current backend record.
                </p>
              </div>

              <div className="px-6 py-6">
                {regulation.summary ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {regulation.summary}
                  </p>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-950">Summary unavailable</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      RegIntelX has the document record, but a generated summary is not currently available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <h2 className="font-semibold tracking-tight text-slate-950">
                      Detected changes
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Change records linked to this regulation.
                    </p>
                  </div>
                </div>
              </div>
              <ChangesPanel changes={relatedChanges} loading={loading} compact />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <h2 className="font-semibold tracking-tight text-slate-950">
                      Compliance actions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Trackable work linked to this regulation.
                    </p>
                  </div>
                </div>
              </div>
              <ActionsPanel maps={relatedActions} loading={loading} compact />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                <h2 className="font-semibold tracking-tight text-slate-950">
                  Document access
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open the authoritative document directly from the registered source.
              </p>

              <a
                href={regulation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Open source
                <ExternalLink size={15} />
              </a>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-slate-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  RegIntelX
                </p>
              </div>

              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                Regulation → change → action
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                The source document feeds the detection pipeline, which produces changes, impact assessment, and compliance work.
              </p>

              <Link
                href="/actions"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-600"
              >
                Open compliance actions
                <ArrowUpRight size={14} />
              </Link>
            </section>

            {relatedChanges.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Related change
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This regulation is connected to {relatedChanges.length} detected change{relatedChanges.length === 1 ? "" : "s"} in the current data.
                </p>
                <Link
                  href="/changes"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Review changes
                  <ArrowUpRight size={14} />
                </Link>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Source relationship
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {matchedSource
                  ? `${matchedSource.name} is the closest authority match for this regulation.`
                  : "No direct source relationship could be inferred from the current backend data."}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
