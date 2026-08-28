"use client";

import { useRegIntel } from "@/components/regintelx/data-provider";
import {
  ActionsPanel,
  AttentionPanel,
  ChangesPanel,
  MetricsGrid,
  PageIntro,
  RegulationsPanel,
  SourcesPanel,
  SystemStatusPanel,
} from "@/components/regintelx/workspace";

export default function Home() {
  const { loading, changes, maps, regulations, sources } = useRegIntel();

  return (
    <>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <PageIntro
          eyebrow="Compliance intelligence"
          title="Regulatory command center"
          description="Detect regulatory changes, understand their impact, and turn them into trackable compliance actions."
        />
        <div className="md:mb-8 md:w-72">
          <SystemStatusPanel />
        </div>
      </div>

      <MetricsGrid />
      <AttentionPanel />

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <ChangesPanel changes={changes} loading={loading} compact />
        <ActionsPanel maps={maps} loading={loading} compact />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <RegulationsPanel regulations={regulations} loading={loading} compact />
        <SourcesPanel sources={sources} regulations={regulations} loading={loading} />
      </div>
    </>
  );
}
