"use client";

import { useState } from "react";
import { useRegIntel } from "@/components/regintelx/data-provider";
import {
  ActionsPanel,
  ChangesPanel,
  MetricsGrid,
  PageIntro,
} from "@/components/regintelx/panels";

export default function ChangesPage() {
  const { loading, changes, maps } = useRegIntel();
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const visibleMaps = selectedChange
    ? maps.filter((map) => map.change_id === selectedChange)
    : maps;

  return (
    <>
      <PageIntro
        eyebrow="Change detection"
        title="Regulatory changes"
        description="Review detected changes, affected domains, impact level, and the compliance work generated from each change."
      />
      <MetricsGrid />
      <div className="mt-8 space-y-8">
        <ChangesPanel
          changes={changes}
          loading={loading}
          selectedChange={selectedChange}
          onSelectedChange={setSelectedChange}
        />
        <ActionsPanel
          maps={visibleMaps}
          loading={loading}
          selectedChange={selectedChange}
        />
      </div>
    </>
  );
}
