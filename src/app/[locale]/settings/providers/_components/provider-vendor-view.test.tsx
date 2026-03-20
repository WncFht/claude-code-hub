/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ProviderDisplay } from "@/types/provider";
import enMessages from "../../../../../../messages/en";
import { ProviderVendorView } from "./provider-vendor-view";

vi.mock("@/actions/provider-endpoints", () => ({
  getProviderVendors: vi.fn(async () => [
    {
      id: 101,
      displayName: "Anthropic",
      websiteDomain: "anthropic.com",
      websiteUrl: "https://anthropic.com",
      faviconUrl: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ]),
  removeProviderVendor: vi.fn(async () => ({ ok: true })),
}));

vi.mock("./vendor-keys-compact-list", () => ({
  VendorKeysCompactList: ({ vendorId }: { vendorId: number }) => (
    <div data-testid={`vendor-keys-${vendorId}`}>Vendor keys {vendorId}</div>
  ),
}));

vi.mock("./provider-endpoints-table", () => ({
  ProviderEndpointsSection: ({ vendorId }: { vendorId: number }) => (
    <div data-testid={`vendor-endpoints-${vendorId}`}>Vendor endpoints {vendorId}</div>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

async function flushTicks(times = 3) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

describe("ProviderVendorView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  test("renders vendor cards for grouped and orphaned providers", async () => {
    const providers = [
      buildProvider({ id: 1, providerVendorId: 101, name: "Anthropic Key 1" }),
      buildProvider({ id: 2, providerVendorId: null, name: "Loose Key" }),
    ];

    const { container, unmount } = renderWithProviders(
      <ProviderVendorView
        providers={providers}
        enableMultiProviderTypes={true}
        healthStatus={{}}
        statistics={{}}
        statisticsLoading={false}
        currencyCode="USD"
      />
    );

    await flushTicks(5);

    const vendorCards = container.querySelectorAll('[data-slot="provider-vendor-card"]');
    expect(vendorCards).toHaveLength(2);
    expect(container.textContent).toContain("Anthropic");
    expect(container.textContent).toContain("Unknown Vendor");
    expect(container.querySelector('[data-testid="vendor-keys-101"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="vendor-endpoints-101"]')).not.toBeNull();

    unmount();
  });
});
