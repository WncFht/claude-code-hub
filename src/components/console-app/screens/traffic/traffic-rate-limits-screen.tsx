"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { RateLimitDashboard } from "@/app/[locale]/dashboard/rate-limits/_components/rate-limit-dashboard";
import { RateLimitsContentSkeleton } from "@/app/[locale]/dashboard/rate-limits/_components/rate-limits-skeleton";
import { Section } from "@/components/section";

export default function TrafficRateLimitsScreen() {
  const t = useTranslations("dashboard.rateLimits");

  return (
    <div data-slot="console-screen" data-screen-id="traffic-rate-limits">
      <div data-slot="traffic-rate-limits-screen" className="space-y-4">
        <Section title={t("title")} description={t("description")}>
          <Suspense fallback={<RateLimitsContentSkeleton />}>
            <RateLimitDashboard />
          </Suspense>
        </Section>
      </div>
    </div>
  );
}
