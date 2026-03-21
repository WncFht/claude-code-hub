/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ChartContainer } from "./chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => null,
}));

function renderChart() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ChartContainer config={{ value: { label: "Value", color: "var(--chart-1)" } }}>
        <div data-testid="chart-child" />
      </ChartContainer>
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

describe("ChartContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("pins min-width and min-height to zero so ResponsiveContainer never receives negative flex sizes", () => {
    const { container, unmount } = renderChart();

    const chart = container.querySelector('[data-slot="chart"]');

    expect(chart?.className).toContain("min-w-0");
    expect(chart?.className).toContain("min-h-0");

    unmount();
  });
});
