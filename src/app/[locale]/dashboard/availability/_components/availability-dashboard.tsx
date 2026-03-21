"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getAvailabilityQueryOptions, type TimeRangeOption } from "./availability-data";
import { EndpointTab } from "./endpoint/endpoint-tab";
import { OverviewSection } from "./overview/overview-section";
import { ProviderTab } from "./provider/provider-tab";

export type { TimeRangeOption } from "./availability-data";

export function AvailabilityDashboard() {
  const t = useTranslations("dashboard.availability");
  const [activeTab, setActiveTab] = useState<"provider" | "endpoint">("provider");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("24h");
  const lastFocusRefreshAtRef = useRef(0);
  const {
    data,
    isLoading: loading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    ...getAvailabilityQueryOptions(timeRange),
    placeholderData: keepPreviousData,
    refetchInterval: activeTab === "provider" ? 30_000 : 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const refreshing = isFetching && !loading;
  const errorMessage = error instanceof Error ? error.message : null;
  const availabilityData = data ?? null;

  // 当页面从后台回到前台时，做一次节流刷新，避免看到陈旧数据；同时配合 visibility 判断减少后台请求。
  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      if (now - lastFocusRefreshAtRef.current < 2000) return;
      lastFocusRefreshAtRef.current = now;
      void refetch();
    };

    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refetch]);

  const overviewMetrics = useMemo(() => {
    const providers = availabilityData?.providers ?? [];
    const providersWithLatency = providers.filter((p) =>
      p.timeBuckets.some((b) => b.avgLatencyMs > 0)
    );

    let activeProbes = 0;
    let healthyCount = 0;
    let unhealthyCount = 0;
    for (const provider of providers) {
      if (provider.currentStatus !== "unknown") activeProbes += 1;
      if (provider.currentStatus === "green") healthyCount += 1;
      if (provider.currentStatus === "red") unhealthyCount += 1;
    }

    const avgLatency =
      providersWithLatency.length > 0
        ? providersWithLatency.reduce((sum, p) => {
            const latencies = p.timeBuckets
              .filter((b) => b.avgLatencyMs > 0)
              .map((b) => b.avgLatencyMs);
            if (latencies.length === 0) return sum;
            return sum + latencies.reduce((a, b) => a + b, 0) / latencies.length;
          }, 0) / providersWithLatency.length
        : 0;

    const errorRate =
      providers.length > 0
        ? providers.reduce((sum, p) => {
            const total = p.totalRequests;
            const errors = p.timeBuckets.reduce((s, b) => s + b.redCount, 0);
            return sum + (total > 0 ? errors / total : 0);
          }, 0) / providers.length
        : 0;

    return {
      systemAvailability: availabilityData?.systemAvailability ?? 0,
      avgLatency,
      errorRate,
      activeProbes,
      totalProbes: providers.length,
      healthyCount,
      unhealthyCount,
    };
  }, [availabilityData]);

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <OverviewSection
        systemAvailability={overviewMetrics.systemAvailability}
        avgLatency={overviewMetrics.avgLatency}
        errorRate={overviewMetrics.errorRate}
        activeProbes={overviewMetrics.activeProbes}
        totalProbes={overviewMetrics.totalProbes}
        loading={loading}
        refreshing={refreshing}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "provider" | "endpoint")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger
            value="provider"
            className={cn(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            )}
          >
            {t("tabs.provider")}
          </TabsTrigger>
          <TabsTrigger
            value="endpoint"
            className={cn(
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            )}
          >
            {t("tabs.endpoint")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="mt-0">
          <ProviderTab
            data={availabilityData}
            loading={loading}
            refreshing={refreshing}
            error={errorMessage}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onRefresh={() => {
              void refetch();
            }}
          />
        </TabsContent>

        <TabsContent value="endpoint" className="mt-0">
          <EndpointTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
