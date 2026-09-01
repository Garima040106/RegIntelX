"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRegIntel } from "@/components/regintelx/data-provider";
import {
  ActionsPanel,
  AttentionPanel,
  ChangesPanel,
  MetricsGrid,
  RegulationsPanel,
  SourcesPanel,
  SystemStatusPanel,
} from "@/components/regintelx/workspace";

function DashboardHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { staggerChildren: 0.06, delayChildren: 0.04 },
        },
      }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]"
    >
      <div className="max-w-4xl space-y-4">
        <motion.p
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500"
        >
          REGULATORY INTELLIGENCE
        </motion.p>
        <motion.h2
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
        >
          Regulatory command center
        </motion.h2>
        <motion.p
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base"
        >
          Detect what changed, understand why it matters, and turn regulatory updates into trackable compliance work.
        </motion.p>
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        className="xl:justify-self-end"
      >
        <SystemStatusPanel />
      </motion.div>
    </motion.section>
  );
}

export default function Home() {
  const { loading, changes, maps, regulations, sources } = useRegIntel();

  return (
    <div className="space-y-8">
      <section id="overview" className="scroll-mt-40 space-y-6">
        <DashboardHero />
        <MetricsGrid />
        <AttentionPanel />
      </section>

      <section id="changes" className="scroll-mt-40">
        <ChangesPanel changes={changes} loading={loading} compact />
      </section>

      <section id="actions" className="scroll-mt-40">
        <ActionsPanel maps={maps} loading={loading} compact />
      </section>

      <section id="regulations" className="scroll-mt-40">
        <RegulationsPanel regulations={regulations} loading={loading} compact />
      </section>

      <section id="sources" className="scroll-mt-40">
        <SourcesPanel sources={sources} loading={loading} />
      </section>
    </div>
  );
}
