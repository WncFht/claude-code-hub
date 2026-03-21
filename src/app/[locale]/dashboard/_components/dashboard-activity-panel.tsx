"use client";

import { useLocale, useTimeZone, useTranslations } from "next-intl";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/lib/utils/currency";
import type { UserStatisticsData } from "@/types/statistics";

const WEEKS = 54;
const DAYS_PER_WEEK = 7;
const CELL_COUNT = WEEKS * DAYS_PER_WEEK;

interface DashboardActivityPanelProps {
  data?: UserStatisticsData;
  isLoading?: boolean;
}

interface ActivityDay {
  dateKey: string;
  dateLabel: string;
  totalCalls: number;
  totalCost: number;
  level: number;
  isFuture: boolean;
}

interface ActivityTooltipState {
  dateLabel: string;
  totalCalls: number;
  totalCost: number;
  x: number;
  y: number;
  visible: boolean;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone,
  }).format(date);
}

function sumMetricByDay(data: UserStatisticsData | undefined, suffix: "_calls" | "_cost") {
  const totals = new Map<string, number>();

  for (const item of data?.chartData ?? []) {
    const dateKey = String(item.date);
    let total = 0;

    for (const [key, value] of Object.entries(item)) {
      if (!key.endsWith(suffix)) continue;
      total += typeof value === "number" ? value : Number(value ?? 0);
    }

    totals.set(dateKey, total);
  }

  return totals;
}

function getActivityThresholds(values: number[]) {
  if (values.length === 0) return [1, 2, 3, 4];

  const sorted = [...values].sort((a, b) => a - b);
  const pick = (ratio: number) => {
    const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
    return sorted[index] ?? 0;
  };

  return [
    Math.max(1, pick(0.2)),
    Math.max(2, pick(0.45)),
    Math.max(3, pick(0.7)),
    Math.max(4, pick(0.9)),
  ];
}

function getActivityLevel(value: number, thresholds: number[]) {
  if (value <= 0) return 0;
  if (value >= thresholds[3]) return 4;
  if (value >= thresholds[2]) return 3;
  if (value >= thresholds[1]) return 2;
  return 1;
}

export function DashboardActivityPanel({ data, isLoading = false }: DashboardActivityPanelProps) {
  const t = useTranslations("dashboard.home.activity");
  const tStats = useTranslations("dashboard.stats");
  const locale = useLocale();
  const timeZone = useTimeZone() ?? "UTC";
  const [tooltip, setTooltip] = useState<ActivityTooltipState | null>(null);
  const [maskImage, setMaskImage] = useState("none");

  const dailyTotals = useMemo(() => sumMetricByDay(data, "_calls"), [data]);
  const dailyCosts = useMemo(() => sumMetricByDay(data, "_cost"), [data]);
  const thresholds = useMemo(
    () => getActivityThresholds(Array.from(dailyTotals.values()).filter((value) => value > 0)),
    [dailyTotals]
  );

  const days = useMemo<ActivityDay[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * DAYS_PER_WEEK);

    return Array.from({ length: CELL_COUNT }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const isFuture = date.getTime() > today.getTime();

      const dateKey = toDateKey(date);
      const totalCalls = isFuture ? 0 : (dailyTotals.get(dateKey) ?? 0);
      const totalCost = isFuture ? 0 : (dailyCosts.get(dateKey) ?? 0);

      return {
        dateKey,
        dateLabel: formatDayLabel(date, locale, timeZone),
        totalCalls,
        totalCost,
        level: isFuture ? 0 : getActivityLevel(totalCalls, thresholds),
        isFuture,
      };
    });
  }, [dailyCosts, dailyTotals, locale, thresholds, timeZone]);

  const totalCalls = useMemo(() => days.reduce((sum, item) => sum + item.totalCalls, 0), [days]);
  const activeDays = useMemo(() => days.filter((item) => item.totalCalls > 0).length, [days]);

  const handleScrollMask = useCallback((element?: HTMLDivElement | null) => {
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    const isStart = scrollLeft <= 1;
    const isEnd = Math.abs(scrollWidth - clientWidth - scrollLeft) <= 1;

    if (isStart && isEnd) {
      setMaskImage("none");
    } else if (isStart) {
      setMaskImage("linear-gradient(to left, transparent, rgba(0,0,0,0) 10px, black 40px)");
    } else if (isEnd) {
      setMaskImage("linear-gradient(to right, transparent, rgba(0,0,0,0) 10px, black 40px)");
    } else {
      setMaskImage(
        "linear-gradient(to right, transparent, rgba(0,0,0,0) 10px, black 40px, black calc(100% - 40px), rgba(0,0,0,0) calc(100% - 10px), transparent)"
      );
    }
  }, []);

  const setScrollRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      element.scrollLeft = element.scrollWidth;
      handleScrollMask(element);
    },
    [handleScrollMask]
  );

  useLayoutEffect(() => {
    const element = document.querySelector<HTMLDivElement>('[data-slot="activity-scroll-region"]');
    if (!element) return;
    element.scrollLeft = element.scrollWidth;
    handleScrollMask(element);
  }, [handleScrollMask]);

  useLayoutEffect(() => {
    const handleResize = () => {
      const element = document.querySelector<HTMLDivElement>(
        '[data-slot="activity-scroll-region"]'
      );
      if (!element) return;
      element.scrollLeft = element.scrollWidth;
      handleScrollMask(element);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleScrollMask]);

  return (
    <div
      data-slot="dashboard-activity-panel"
      className="rounded-[1.85rem] border border-border/60 bg-card/88 p-5 shadow-[0_18px_54px_-42px_rgba(6,17,11,0.5)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-end gap-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              {t("summary.requests")}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {totalCalls.toLocaleString()}
            </div>
          </div>
          <div className="h-10 w-px bg-border/60" />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              {t("summary.activeDays")}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {activeDays}
            </div>
          </div>
        </div>
        <div className="pt-1 text-sm font-medium text-muted-foreground">{t("summary.window")}</div>
      </div>

      <div
        ref={setScrollRef}
        data-slot="activity-scroll-region"
        onScroll={(event) => handleScrollMask(event.currentTarget)}
        className="mt-5 overflow-x-auto pb-1 scrollbar-hide"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <div className="ml-auto w-fit">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${WEEKS}, 0.875rem)`,
              gridTemplateRows: `repeat(${DAYS_PER_WEEK}, 0.875rem)`,
              gridAutoFlow: "column",
            }}
          >
            {days.map((day) => {
              if (day.isFuture) {
                return <div key={day.dateKey} data-slot="activity-future-cell" />;
              }

              return (
                <div
                  key={day.dateKey}
                  data-slot="activity-cell"
                  data-total-calls={day.totalCalls}
                  className="rounded-[4px] transition-all cursor-pointer hover:scale-150"
                  aria-label={`${day.dateLabel}: ${day.totalCalls > 0 ? day.totalCalls.toLocaleString() : t("noData")}`}
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTooltip({
                      dateLabel: day.dateLabel,
                      totalCalls: day.totalCalls,
                      totalCost: day.totalCost,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      visible: true,
                    });
                  }}
                  onMouseLeave={() =>
                    setTooltip((current) => (current ? { ...current, visible: false } : null))
                  }
                  style={{
                    backgroundColor: isLoading
                      ? "color-mix(in oklch, var(--muted) 75%, white)"
                      : day.level === 0
                        ? "color-mix(in oklch, var(--muted) 80%, transparent)"
                        : `color-mix(in oklch, var(--primary) ${28 + day.level * 16}%, white)`,
                    boxShadow:
                      day.level >= 3
                        ? "0 0 12px color-mix(in oklch, var(--primary) 36%, transparent)"
                        : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("legend.quiet")}</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-3 w-3 rounded-[4px]"
                style={{
                  backgroundColor:
                    level === 0
                      ? "color-mix(in oklch, var(--muted) 80%, transparent)"
                      : `color-mix(in oklch, var(--primary) ${28 + level * 16}%, white)`,
                }}
              />
            ))}
          </div>
          <span>{t("legend.busy")}</span>
        </div>
      </div>

      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              data-slot="activity-tooltip"
              className={`pointer-events-none fixed z-50 min-w-max rounded-[1.15rem] border border-border/60 bg-background/96 px-3 py-2.5 text-sm text-foreground shadow-[0_24px_60px_-36px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-opacity duration-300 ${tooltip.visible ? "opacity-100" : "opacity-0"}`}
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform:
                  tooltip.y < window.innerHeight / 2
                    ? "translate(-50%, 12px)"
                    : "translate(-50%, calc(-100% - 12px))",
              }}
            >
              <div className="space-y-1.5">
                <div className="font-semibold">{tooltip.dateLabel}</div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{tStats("requests")}</span>
                  <span className="font-medium text-foreground">
                    {tooltip.totalCalls > 0 ? tooltip.totalCalls.toLocaleString() : t("noData")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{tStats("cost")}</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(tooltip.totalCost, "USD", locale)}
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
