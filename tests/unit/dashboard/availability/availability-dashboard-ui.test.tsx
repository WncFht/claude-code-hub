/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test, vi } from "vitest";
import { AvailabilityDashboard } from "@/app/[locale]/dashboard/availability/_components/availability-dashboard";

vi.mock("@/app/[locale]/dashboard/availability/_components/overview/overview-section", () => ({
  OverviewSection: () => <div data-testid="overview-section" />,
}));
vi.mock("@/app/[locale]/dashboard/availability/_components/provider/provider-tab", () => ({
  ProviderTab: () => <div data-testid="provider-tab" />,
}));
vi.mock("@/app/[locale]/dashboard/availability/_components/endpoint/endpoint-tab", () => ({
  EndpointTab: () => <div data-testid="endpoint-tab" />,
}));

function renderWithIntl(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale="en"
          timeZone="UTC"
          messages={{
            dashboard: {
              availability: {
                tabs: { provider: "Provider", endpoint: "Endpoint" },
                states: { fetchFailed: "Fetch failed" },
                actions: {
                  probeAll: "Probe All",
                  probing: "Probing",
                  probeSuccess: "Probe success",
                  probeFailed: "Probe failed",
                },
              },
            },
          }}
        >
          {node}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      queryClient.clear();
      container.remove();
    },
  };
}

describe("AvailabilityDashboard UI", () => {
  test("does not render Probe All floating button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ providers: [], systemAvailability: 0 }),
      }))
    );

    const { container, unmount } = renderWithIntl(<AvailabilityDashboard />);

    expect(container.textContent).not.toContain("Probe All");

    unmount();
  });
});
