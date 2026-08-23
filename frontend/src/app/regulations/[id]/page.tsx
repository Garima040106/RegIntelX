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
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <FileText size={17} />
                Regulatory Document
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                {regulation.title}
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash size={16} />
                  Circular Number
                </div>

                <p className="mt-2 font-medium">
                  {regulation.circular_number || "Not available"}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Activity size={16} />
                  Status
                </div>

                <p className="mt-2 font-medium capitalize">
                  {regulation.status}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  Published Date
                </div>

                <p className="mt-2 font-medium">
                  {regulation.published_date || "Not available"}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  Effective Date
                </div>

                <p className="mt-2 font-medium">
                  {regulation.effective_date || "Not available"}
                </p>
              </div>
            </div>

            {regulation.summary && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold">
                  Summary
                </h2>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
                  {regulation.summary}
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold">
                Original Document
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                View the original regulatory document from its source.
              </p>

              <a
                href={regulation.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                View original document
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
