"use client";

import { useRegIntel } from "@/components/regintelx/data-provider";
import { PageIntro, SourcesPanel } from "@/components/regintelx/panels";

export default function SourcesPage() {
  const { loading, sources } = useRegIntel();

  return (
    <>
      <PageIntro
        eyebrow="Source monitoring"
        title="Regulatory sources"
        description="Review the authorities and source systems that feed the RegIntelX regulatory intelligence workflow."
      />
      <SourcesPanel sources={sources} loading={loading} />
    </>
  );
}
