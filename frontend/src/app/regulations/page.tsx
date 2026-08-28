"use client";

import { useRegIntel } from "@/components/regintelx/data-provider";
import {
  PageIntro,
  RegulationsPanel,
} from "@/components/regintelx/panels";

export default function RegulationsPage() {
  const { loading, regulations } = useRegIntel();

  return (
    <>
      <PageIntro
        eyebrow="Regulatory register"
        title="Regulations"
        description="Search monitored regulations by meaning, requirement, circular number, or source material."
      />
      <RegulationsPanel regulations={regulations} loading={loading} />
    </>
  );
}
