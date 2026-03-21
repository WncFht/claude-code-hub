/**
 * @vitest-environment happy-dom
 */

import fs from "node:fs";
import path from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { UserStatisticsData } from "@/types/statistics";
import { DashboardActivityPanel } from "./dashboard-activity-panel";

const dashboardMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "messages/en/dashboard.json"), "utf8")
);

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

const mockStatistics: UserStatisticsData = {
  chartData: [
    {
      date: isoDate(-1),
      "user-1_calls": 4,
      "user-1_cost": "0.2",
    },
    {
      date: isoDate(0),
      "user-1_calls": 18,
      "user-1_cost": "0.8",
    },
  ],
  users: [{ id: 1, name: "Alpha", dataKey: "user-1" }],
  timeRange: "30days",
  resolution: "day",
  mode: "users",
};

function renderPanel() {
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
        <DashboardActivityPanel data={mockStatistics} />
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

describe("DashboardActivityPanel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("shows a hover tooltip for the active day cell", () => {
    const { container, unmount } = renderPanel();

    const cells = container.querySelectorAll<HTMLElement>('[data-slot="activity-cell"]');
    expect(cells.length).toBeGreaterThan(0);

    const activeCell = Array.from(cells).find(
      (cell) => cell.getAttribute("data-total-calls") === "18"
    );
    expect(activeCell).toBeTruthy();

    activeCell!.getBoundingClientRect = () =>
      ({
        left: 140,
        top: 120,
        width: 14,
        height: 14,
        right: 154,
        bottom: 134,
        x: 140,
        y: 120,
        toJSON: () => ({}),
      }) as DOMRect;

    act(() => {
      activeCell!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const tooltip = document.body.querySelector('[data-slot="activity-tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(document.body.textContent).toContain("18");
    expect(document.body.textContent).toContain("$0.80");

    unmount();
  });
});
