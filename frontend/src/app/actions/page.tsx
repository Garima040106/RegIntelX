"use client";

import { useRegIntel } from "@/components/regintelx/data-provider";
import {
  ActionsPanel,
  MetricsGrid,
  PageIntro,
} from "@/components/regintelx/panels";

export default function ActionsPage() {
  const { loading, maps } = useRegIntel();

  return (
    <>
      <PageIntro
        eyebrow="Compliance execution"
        title="Compliance actions"
        description="Track open work, review required evidence, monitor risk, and move compliance actions through completion."
      />
      <MetricsGrid />
      <div className="mt-8">
        <ActionsPanel maps={maps} loading={loading} />
      </div>
    </>
  );
}
