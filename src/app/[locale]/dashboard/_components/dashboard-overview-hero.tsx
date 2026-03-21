"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";
import { cn } from "@/lib/utils";
import type { TimeRange } from "@/types/statistics";
import { TIME_RANGE_OPTIONS } from "@/types/statistics";

interface DashboardOverviewHeroMetric {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

interface DashboardOverviewHeroProps {
  metrics: DashboardOverviewHeroMetric[];
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

export function DashboardOverviewHero({
  metrics,
  timeRange,
  onTimeRangeChange,
}: DashboardOverviewHeroProps) {
  const t = useTranslations("dashboard.home");
  const tStatistics = useTranslations("dashboard.statistics");

  return (
    <PageHero
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      metrics={metrics}
      actions={
        <div className="rounded-[1.5rem] border border-white/45 bg-background/70 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-wrap gap-2">
            {TIME_RANGE_OPTIONS.map((option) => {
              const active = option.key === timeRange;

              return (
                <button
                  key={option.key}
                  type="button"
                  data-active={active}
                  onClick={() => onTimeRangeChange(option.key)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-all",
                    active
                      ? "border-primary/25 bg-primary text-primary-foreground shadow-[0_12px_30px_-18px_rgba(69,115,92,0.9)]"
                      : "border-border/70 bg-background/65 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                  )}
                >
                  {tStatistics(`timeRange.${option.key}`)}
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
