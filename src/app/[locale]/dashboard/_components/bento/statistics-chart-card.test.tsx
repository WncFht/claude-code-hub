/**
 * @vitest-environment happy-dom
 */

import fs from "node:fs";
import path from "node:path";
import type { CSSProperties, ReactNode, Ref } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { UserStatisticsData } from "@/types/statistics";
import { StatisticsChartCard } from "./statistics-chart-card";

vi.mock("./bento-grid", () => ({
  BentoCard: ({
    children,
    className,
    ref,
  }: {
    children: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
  }) => (
    <div ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({
    children,
    className,
    style,
  }: {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
  }) => (
    <div data-slot="mock-chart-container" className={className} style={style}>
      {children}
    </div>
  ),
  ChartTooltip: () => null,
}));

vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-slot="mock-area-chart">{children}</div>
  ),
  Area: ({ stroke, fill, dataKey }: { stroke?: string; fill?: string; dataKey?: string }) => (
    <div data-slot="mock-area" data-stroke={stroke} data-fill={fill} data-key={dataKey} />
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const dashboardMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "messages/en/dashboard.json"), "utf8")
);

const mockData: UserStatisticsData = {
  chartData: [
    {
      date: "2026-03-20T00:00:00.000Z",
      "user-1_calls": 12,
      "user-1_cost": "1.2",
      "user-2_calls": 4,
      "user-2_cost": "0.4",
    },
  ],
  users: [
    { id: 1, name: "Alpha", dataKey: "user-1" },
    { id: 2, name: "Beta", dataKey: "user-2" },
  ],
  timeRange: "today",
  resolution: "hour",
  mode: "users",
};

function renderCard() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <NextIntlClientProvider
        locale="en"
        messages={{ dashboard: dashboardMessages }}
        timeZone="UTC"
      >
        <StatisticsChartCard data={mockData} />
      </NextIntlClientProvider>
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("StatisticsChartCard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        height: 900,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  test("uses dedicated multi-user series colors and renders octopus-like summary cards", () => {
    const { container, unmount } = renderCard();

    const summaryCards = container.querySelectorAll('[data-slot="statistics-summary-card"]');
    expect(summaryCards.length).toBe(2);

    const legendDots = container.querySelectorAll<HTMLElement>(
      '[data-slot="statistics-legend-dot"]'
    );
    expect(legendDots.length).toBeGreaterThanOrEqual(2);
    expect(legendDots[0]?.style.backgroundColor).toBe("var(--dashboard-user-series-1)");
    expect(legendDots[1]?.style.backgroundColor).toBe("var(--dashboard-user-series-2)");

    const series = container.querySelectorAll<HTMLElement>('[data-slot="mock-area"]');
    expect(Array.from(series).map((node) => node.dataset.stroke)).toEqual(
      expect.arrayContaining(["var(--dashboard-user-series-1)", "var(--dashboard-user-series-2)"])
    );

    unmount();
  });
});
