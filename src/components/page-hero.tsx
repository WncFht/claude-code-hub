"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroMetric {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

interface PageHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metrics?: PageHeroMetric[];
  actions?: ReactNode;
  className?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  metrics = [],
  actions,
  className,
}: PageHeroProps) {
  return (
    <motion.section
      data-slot="page-hero"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 px-6 py-6 shadow-[0_20px_70px_-45px_rgba(30,41,59,0.35)] backdrop-blur-xl md:px-8 md:py-8",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(81,167,124,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(181,204,192,0.25),transparent_30%)]" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {eyebrow ? (
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                {eyebrow}
              </div>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        {metrics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.35rem] border border-border/60 bg-background/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
              >
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                  {metric.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {metric.value}
                </div>
                {metric.hint ? (
                  <div className="mt-1 text-xs text-muted-foreground">{metric.hint}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
