"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Activity, Clock, DollarSign, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { OverviewData } from "@/actions/overview";
import type { CurrencyCode } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import type { TimeRange, UserStatisticsData } from "@/types/statistics";
import { DashboardActivityPanel } from "../dashboard-activity-panel";
import { DashboardOverviewHero } from "../dashboard-overview-hero";
import { DashboardStage } from "../dashboard-stage";
import { BentoGrid } from "./bento-grid";
import {
  DASHBOARD_BENTO_DEFAULT_TIME_RANGE,
  type DashboardLeaderboardData,
  getActiveSessionsQueryOptions,
  getActivityStatisticsQueryOptions,
  getDashboardLeaderboardQueryOptions,
  getOverviewDataQueryOptions,
  getStatisticsQueryOptions,
} from "./dashboard-bento-data";
import { LeaderboardCard } from "./leaderboard-card";
import { LiveSessionsPanel } from "./live-sessions-panel";
import { BentoMetricCard } from "./metric-card";

const StatisticsChartCard = dynamic(
  () => import("./statistics-chart-card").then((mod) => ({ default: mod.StatisticsChartCard })),
  { ssr: false }
);

const REFRESH_INTERVAL = 5000;

interface DashboardBentoProps {
  isAdmin: boolean;
  currencyCode: CurrencyCode;
  allowGlobalUsageView: boolean;
  initialStatistics?: UserStatisticsData;
  initialOverview?: OverviewData;
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatErrorRate(value: number): string {
  const normalizedValue = value <= 1 ? value * 100 : value;
  const roundedValue = Number.isInteger(normalizedValue)
    ? normalizedValue.toString()
    : normalizedValue.toFixed(1);

  return `${roundedValue}%`;
}

/**
 * Calculate percentage change between current and previous values
 */
function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function DashboardBento({
  isAdmin,
  currencyCode,
  allowGlobalUsageView,
  initialStatistics,
  initialOverview,
}: DashboardBentoProps) {
  const t = useTranslations("customs");
  const tl = useTranslations("dashboard.leaderboard");
  const tHome = useTranslations("dashboard.home");
  const tOverview = useTranslations("dashboard.overview");

  const [timeRange, setTimeRange] = useState<TimeRange>(DASHBOARD_BENTO_DEFAULT_TIME_RANGE);
  const canViewLeaderboard = isAdmin || allowGlobalUsageView;

  // Overview metrics (available to all users, but shows different data based on permissions)
  const { data: overview } = useQuery<OverviewData>({
    ...getOverviewDataQueryOptions(),
    refetchInterval: 15_000,
    initialData: initialOverview,
  });

  // Active sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    ...getActiveSessionsQueryOptions(),
    refetchInterval: REFRESH_INTERVAL,
    enabled: isAdmin,
  });

  // Statistics
  const { data: statistics } = useQuery<UserStatisticsData>({
    ...getStatisticsQueryOptions(timeRange),
    initialData: timeRange === DASHBOARD_BENTO_DEFAULT_TIME_RANGE ? initialStatistics : undefined,
    placeholderData: keepPreviousData,
    retry: 3,
  });

  const { data: activityStatistics, isLoading: activityStatisticsLoading } =
    useQuery<UserStatisticsData>({
      ...getActivityStatisticsQueryOptions(),
      retry: 2,
    });

  // Leaderboards
  const { data: userLeaderboard = [], isLoading: userLeaderboardLoading } = useQuery<
    DashboardLeaderboardData[]
  >({
    ...getDashboardLeaderboardQueryOptions("user"),
    enabled: canViewLeaderboard,
  });

  const { data: providerLeaderboard = [], isLoading: providerLeaderboardLoading } = useQuery<
    DashboardLeaderboardData[]
  >({
    ...getDashboardLeaderboardQueryOptions("provider"),
    enabled: canViewLeaderboard,
  });

  const { data: modelLeaderboard = [], isLoading: modelLeaderboardLoading } = useQuery<
    DashboardLeaderboardData[]
  >({
    ...getDashboardLeaderboardQueryOptions("model"),
    enabled: canViewLeaderboard,
  });

  const metrics = overview || {
    concurrentSessions: 0,
    todayRequests: 0,
    todayCost: 0,
    avgResponseTime: 0,
    todayErrorRate: 0,
    yesterdaySamePeriodRequests: 0,
    yesterdaySamePeriodCost: 0,
    yesterdaySamePeriodAvgResponseTime: 0,
    recentMinuteRequests: 0,
  };

  // Calculate comparisons
  const requestsChange = calcPercentageChange(
    metrics.todayRequests,
    metrics.yesterdaySamePeriodRequests
  );
  const costChange = calcPercentageChange(metrics.todayCost, metrics.yesterdaySamePeriodCost);
  const responseTimeChange = calcPercentageChange(
    metrics.avgResponseTime,
    metrics.yesterdaySamePeriodAvgResponseTime
  );

  // Sessions with lastActivityAt for LiveSessionsPanel
  const sessionsWithActivity = useMemo(() => {
    return sessions.map((s) => ({
      ...s,
      lastActivityAt: s.startTime,
    }));
  }, [sessions]);

  const heroMetrics = [
    {
      label: t("metrics.todayRequests"),
      value: metrics.todayRequests.toLocaleString(),
      hint: `${metrics.recentMinuteRequests.toLocaleString()} ${t("metrics.rpm")}`,
    },
    {
      label: t("metrics.todayCost"),
      value: formatCurrency(metrics.todayCost, currencyCode),
      hint: `${costChange > 0 ? "+" : ""}${costChange}% ${t("metrics.vsYesterday")}`,
    },
    {
      label: tOverview("activeSessions"),
      value: metrics.concurrentSessions.toLocaleString(),
    },
    {
      label: tOverview("errorRate"),
      value: formatErrorRate(metrics.todayErrorRate),
      hint: `${t("metrics.avgResponse")}: ${formatResponseTime(metrics.avgResponseTime)}`,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardOverviewHero
        metrics={heroMetrics}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Section 1: Metrics (Admin only) */}
      {isAdmin && (
        <DashboardStage
          title={tHome("sections.pulse.title")}
          description={tHome("sections.pulse.description")}
        >
          <BentoGrid>
            <BentoMetricCard
              title={t("metrics.concurrent")}
              value={metrics.concurrentSessions}
              icon={Activity}
              accentColor="emerald"
              className="min-h-[120px]"
              comparisons={[
                {
                  value: metrics.recentMinuteRequests,
                  label: t("metrics.rpm"),
                  isPercentage: false,
                },
              ]}
            />
            <BentoMetricCard
              title={t("metrics.todayRequests")}
              value={metrics.todayRequests}
              icon={TrendingUp}
              accentColor="blue"
              className="min-h-[120px]"
              comparisons={[{ value: requestsChange, label: t("metrics.vsYesterday") }]}
            />
            <BentoMetricCard
              title={t("metrics.todayCost")}
              value={formatCurrency(metrics.todayCost, currencyCode)}
              icon={DollarSign}
              accentColor="amber"
              className="min-h-[120px]"
              comparisons={[{ value: costChange, label: t("metrics.vsYesterday") }]}
            />
            <BentoMetricCard
              title={t("metrics.avgResponse")}
              value={metrics.avgResponseTime}
              icon={Clock}
              formatter={formatResponseTime}
              accentColor="purple"
              className="min-h-[120px]"
              comparisons={[{ value: -responseTimeChange, label: t("metrics.vsYesterday") }]}
            />
          </BentoGrid>
        </DashboardStage>
      )}

      <div data-slot="dashboard-overview-main-grid" className="grid grid-cols-1 gap-6">
        <DashboardStage
          title={tHome("sections.activity.title")}
          description={tHome("sections.activity.description")}
        >
          <DashboardActivityPanel data={activityStatistics} isLoading={activityStatisticsLoading} />
        </DashboardStage>

        {/* Section 2: Statistics Chart - Full width */}
        {statistics ? (
          <DashboardStage
            title={tHome("sections.statistics.title")}
            description={tHome("sections.statistics.description")}
          >
            <StatisticsChartCard
              data={statistics}
              onTimeRangeChange={setTimeRange}
              currencyCode={currencyCode}
            />
          </DashboardStage>
        ) : null}
      </div>

      {/* Section 3: Leaderboards + Live Sessions */}
      {canViewLeaderboard && (
        <DashboardStage
          title={tHome("sections.rankings.title")}
          description={tHome("sections.rankings.description")}
        >
          <div
            data-testid={isAdmin ? "dashboard-home-layout" : undefined}
            className={cn(
              "grid gap-6",
              isAdmin
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_280px]"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            <LeaderboardCard
              title={tl("userRankings")}
              entries={userLeaderboard}
              currencyCode={currencyCode}
              isLoading={userLeaderboardLoading}
              emptyText={tl("noData")}
              viewAllHref="/dashboard/leaderboard"
              maxItems={3}
              accentColor="primary"
            />
            <LeaderboardCard
              title={tl("providerRankings")}
              entries={providerLeaderboard}
              currencyCode={currencyCode}
              isLoading={providerLeaderboardLoading}
              emptyText={tl("noData")}
              viewAllHref="/dashboard/leaderboard"
              maxItems={3}
              accentColor="purple"
            />
            <LeaderboardCard
              title={tl("modelRankings")}
              entries={modelLeaderboard}
              currencyCode={currencyCode}
              isLoading={modelLeaderboardLoading}
              emptyText={tl("noData")}
              viewAllHref="/dashboard/leaderboard"
              maxItems={3}
              accentColor="blue"
            />

            {isAdmin && (
              <LiveSessionsPanel
                data-testid="dashboard-home-sidebar"
                sessions={sessionsWithActivity}
                isLoading={sessionsLoading}
              />
            )}
          </div>
        </DashboardStage>
      )}
    </div>
  );
}
