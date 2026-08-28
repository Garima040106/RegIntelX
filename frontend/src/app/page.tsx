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
} from "@/components/regintelx/panels";

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

      <div className="mt-8 space-y-8">
        <ChangesPanel changes={changes} loading={loading} compact />
        <ActionsPanel maps={maps} loading={loading} compact />
        <RegulationsPanel
          regulations={regulations}
          loading={loading}
          compact
        />
        <SourcesPanel sources={sources} loading={loading} />
      </div>
    </>
  );
}
