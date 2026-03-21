/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { User } from "@/types/user";
import ProvidersInventoryScreen from "@/components/console-app/screens/providers/providers-inventory-screen";

const ADMIN_USER: User = {
  id: 1,
  name: "admin",
  description: "",
  role: "admin",
  rpm: null,
  dailyQuota: null,
  providerGroup: null,
  tags: [],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  dailyResetMode: "fixed",
  dailyResetTime: "00:00",
  isEnabled: true,
};

vi.mock("@/components/console-app/hooks/use-console-preferences", () => ({
  useConsolePreferences: <T,>(_scope: string, _key: string, initialValue: T) => [
    initialValue,
    vi.fn(),
  ],
}));

vi.mock("@/components/console-app/adapters/dashboard-bootstrap", () => ({
  getConsoleDashboardContext: vi.fn(async () => ({
    currentUser: ADMIN_USER,
    systemSettings: {
      allowGlobalUsageView: true,
      billingModelSource: "system",
      currencyDisplay: "USD",
    },
    serverTimeZone: "UTC",
  })),
}));

vi.mock("@/app/[locale]/settings/providers/_components/provider-manager-loader", () => ({
  ProviderManagerLoader: ({
    currentUser,
    viewMode,
    sortBy,
  }: {
    currentUser?: User;
    viewMode?: "list" | "vendor";
    sortBy?: string;
  }) => (
    <div
      data-slot="provider-manager-loader"
      data-current-user-role={currentUser?.role ?? "missing"}
      data-view-mode={viewMode}
      data-sort-by={sortBy}
    />
  ),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

async function flushTicks(times = 3) {
  for (let index = 0; index < times; index += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

function renderScreen() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <QueryClientProvider client={createQueryClient()}>
        <ProvidersInventoryScreen />
      </QueryClientProvider>
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

describe("ProvidersInventoryScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("passes admin user context into the provider manager loader", async () => {
    const view = renderScreen();

    await flushTicks(5);

    const loader = view.container.querySelector('[data-slot="provider-manager-loader"]');
    expect(loader).toBeTruthy();
    expect(loader?.getAttribute("data-current-user-role")).toBe("admin");
    expect(loader?.getAttribute("data-view-mode")).toBe("list");
    expect(loader?.getAttribute("data-sort-by")).toBe("priority");

    view.unmount();
  });
});
