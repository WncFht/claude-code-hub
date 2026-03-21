/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProviderManager } from "./provider-manager";
import type { ProviderDisplay } from "@/types/provider";
import type { User } from "@/types/user";
import enMessages from "../../../../../../messages/en";

vi.mock("./batch-edit", () => ({
  ProviderBatchActions: () => <div data-testid="provider-batch-actions" />,
  ProviderBatchDialog: () => <div data-testid="provider-batch-dialog" />,
  ProviderBatchToolbar: ({
    selectedCount,
    totalCount,
  }: {
    selectedCount: number;
    totalCount: number;
  }) => (
    <div data-testid="provider-batch-toolbar">
      Batch {selectedCount}/{totalCount}
    </div>
  ),
}));

vi.mock("./provider-list", () => ({
  ProviderList: ({ providers }: { providers: ProviderDisplay[] }) => (
    <div data-testid="provider-list">List view {providers.length}</div>
  ),
}));

vi.mock("./provider-vendor-view", () => ({
  ProviderVendorView: ({ providers }: { providers: ProviderDisplay[] }) => (
    <div data-testid="provider-vendor-view">Vendor view {providers.length}</div>
  ),
}));

vi.mock("./provider-sort-dropdown", () => ({
  ProviderSortDropdown: () => <div data-testid="provider-sort-dropdown" />,
}));

vi.mock("./provider-type-filter", () => ({
  ProviderTypeFilter: () => <div data-testid="provider-type-filter" />,
}));

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

function buildProvider(overrides: Partial<ProviderDisplay> = {}): ProviderDisplay {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? "Provider",
    url: overrides.url ?? "https://api.example.com",
    maskedKey: overrides.maskedKey ?? "sk-***",
    isEnabled: overrides.isEnabled ?? true,
    weight: overrides.weight ?? 10,
    priority: overrides.priority ?? 1,
    groupPriorities: overrides.groupPriorities ?? null,
    costMultiplier: overrides.costMultiplier ?? 1,
    groupTag: overrides.groupTag ?? null,
    providerType: overrides.providerType ?? "claude",
    providerVendorId: overrides.providerVendorId ?? null,
    preserveClientIp: overrides.preserveClientIp ?? false,
    modelRedirects: overrides.modelRedirects ?? null,
    activeTimeStart: overrides.activeTimeStart ?? null,
    activeTimeEnd: overrides.activeTimeEnd ?? null,
    allowedModels: overrides.allowedModels ?? null,
    discoveredModels: overrides.discoveredModels ?? null,
    modelDiscoveryStatus: overrides.modelDiscoveryStatus ?? null,
    lastModelSyncAt: overrides.lastModelSyncAt ?? null,
    lastModelSyncError: overrides.lastModelSyncError ?? null,
    allowedClients: overrides.allowedClients ?? [],
    blockedClients: overrides.blockedClients ?? [],
    mcpPassthroughType: overrides.mcpPassthroughType ?? "none",
    mcpPassthroughUrl: overrides.mcpPassthroughUrl ?? null,
    limit5hUsd: overrides.limit5hUsd ?? null,
    limitDailyUsd: overrides.limitDailyUsd ?? null,
    dailyResetMode: overrides.dailyResetMode ?? "fixed",
    dailyResetTime: overrides.dailyResetTime ?? "00:00",
    limitWeeklyUsd: overrides.limitWeeklyUsd ?? null,
    limitMonthlyUsd: overrides.limitMonthlyUsd ?? null,
    limitTotalUsd: overrides.limitTotalUsd ?? null,
    limitConcurrentSessions: overrides.limitConcurrentSessions ?? 0,
    maxRetryAttempts: overrides.maxRetryAttempts ?? null,
    circuitBreakerFailureThreshold: overrides.circuitBreakerFailureThreshold ?? 5,
    circuitBreakerOpenDuration: overrides.circuitBreakerOpenDuration ?? 1800000,
    circuitBreakerHalfOpenSuccessThreshold: overrides.circuitBreakerHalfOpenSuccessThreshold ?? 2,
    proxyUrl: overrides.proxyUrl ?? null,
    proxyFallbackToDirect: overrides.proxyFallbackToDirect ?? false,
    firstByteTimeoutStreamingMs: overrides.firstByteTimeoutStreamingMs ?? 30000,
    streamingIdleTimeoutMs: overrides.streamingIdleTimeoutMs ?? 30000,
    requestTimeoutNonStreamingMs: overrides.requestTimeoutNonStreamingMs ?? 30000,
    websiteUrl: overrides.websiteUrl ?? null,
    faviconUrl: overrides.faviconUrl ?? null,
    cacheTtlPreference: overrides.cacheTtlPreference ?? null,
    swapCacheTtlBilling: overrides.swapCacheTtlBilling ?? false,
    context1mPreference: overrides.context1mPreference ?? null,
    codexReasoningEffortPreference: overrides.codexReasoningEffortPreference ?? null,
    codexReasoningSummaryPreference: overrides.codexReasoningSummaryPreference ?? null,
    codexTextVerbosityPreference: overrides.codexTextVerbosityPreference ?? null,
    codexParallelToolCallsPreference: overrides.codexParallelToolCallsPreference ?? null,
    codexServiceTierPreference: overrides.codexServiceTierPreference ?? null,
    anthropicMaxTokensPreference: overrides.anthropicMaxTokensPreference ?? null,
    anthropicThinkingBudgetPreference: overrides.anthropicThinkingBudgetPreference ?? null,
    anthropicAdaptiveThinking: overrides.anthropicAdaptiveThinking ?? null,
    geminiGoogleSearchPreference: overrides.geminiGoogleSearchPreference ?? null,
    tpm: overrides.tpm ?? null,
    rpm: overrides.rpm ?? null,
    rpd: overrides.rpd ?? null,
    cc: overrides.cc ?? null,
    createdAt: overrides.createdAt ?? "2026-03-20T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-20T00:00:00.000Z",
    todayTotalCostUsd: overrides.todayTotalCostUsd,
    todayCallCount: overrides.todayCallCount,
    lastCallTime: overrides.lastCallTime,
    lastCallModel: overrides.lastCallModel,
  };
}

function renderWithProviders(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
          {node}
        </NextIntlClientProvider>
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

describe("ProviderManager operator view", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  test("renders operator hero metrics and supports switching to vendor view", () => {
    const providers = [
      buildProvider({ id: 1, groupTag: "alpha,beta" }),
      buildProvider({ id: 2, isEnabled: false, groupTag: null }),
      buildProvider({ id: 3, activeTimeStart: "09:00", activeTimeEnd: "18:00" }),
    ];

    const { container, unmount } = renderWithProviders(
      <ProviderManager
        providers={providers}
        currentUser={ADMIN_USER}
        healthStatus={{
          2: {
            circuitState: "open",
            failureCount: 1,
            lastFailureTime: null,
            circuitOpenUntil: null,
            recoveryMinutes: null,
          },
        }}
        endpointCircuitInfo={{
          3: [
            {
              endpointId: 301,
              circuitState: "open",
              failureCount: 1,
              circuitOpenUntil: null,
            },
          ],
        }}
        enableMultiProviderTypes={true}
        addDialogSlot={<button type="button">Add provider</button>}
      />
    );

    expect(container.querySelector('[data-slot="page-hero"]')).toBeTruthy();
    expect(container.textContent).toContain("Provider operations");
    expect(container.textContent).toContain("Attention");
    expect(container.textContent).toContain("Scheduled");
    expect(container.textContent).toContain("3");
    expect(container.querySelector('[data-testid="provider-list"]')?.textContent).toContain(
      "List view 3"
    );

    const vendorButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Vendor")
    );
    expect(vendorButton).toBeTruthy();

    act(() => {
      vendorButton?.click();
    });

    expect(container.querySelector('[data-testid="provider-vendor-view"]')?.textContent).toContain(
      "Vendor view 3"
    );

    unmount();
  });

  test("does not render a second top-level hero when embedded in the providers module page", () => {
    const providers = [buildProvider({ id: 1 })];

    const { container, unmount } = renderWithProviders(
      <ProviderManager
        providers={providers}
        currentUser={ADMIN_USER}
        healthStatus={{}}
        enableMultiProviderTypes={true}
        embedded={true}
      />
    );

    expect(container.querySelector('[data-slot="page-hero"]')).toBeNull();
    expect(container.querySelector('[data-testid="provider-list"]')?.textContent).toContain(
      "List view 1"
    );

    unmount();
  });

  test("hides batch edit toolbar in vendor view", () => {
    const providers = [buildProvider({ id: 1 }), buildProvider({ id: 2 })];

    const { container, unmount } = renderWithProviders(
      <ProviderManager
        providers={providers}
        currentUser={ADMIN_USER}
        healthStatus={{}}
        enableMultiProviderTypes={true}
        embedded={true}
        viewMode="vendor"
      />
    );

    expect(container.querySelector('[data-testid="provider-vendor-view"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="provider-batch-toolbar"]')).toBeNull();
    expect(container.querySelector('[data-testid="provider-batch-dialog"]')).toBeNull();

    unmount();
  });
});
