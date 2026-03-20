import { describe, expect, test } from "vitest";
import type { ProviderDisplay } from "@/types/provider";
import {
  summarizeProvidersForOperatorView,
  type ProviderEndpointCircuitInfoMap,
  type ProviderHealthStatusMap,
} from "./provider-operator-overview";

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

describe("summarizeProvidersForOperatorView", () => {
  test("aggregates provider counts, groups, schedules, and attention state", () => {
    const providers = [
      buildProvider({ id: 1, isEnabled: true, groupTag: "alpha,beta" }),
      buildProvider({ id: 2, isEnabled: false, groupTag: null }),
      buildProvider({ id: 3, isEnabled: true, activeTimeStart: "09:00", activeTimeEnd: "18:00" }),
    ];
    const healthStatus: ProviderHealthStatusMap = {
      1: {
        circuitState: "closed",
        failureCount: 0,
        lastFailureTime: null,
        circuitOpenUntil: null,
        recoveryMinutes: null,
      },
      2: {
        circuitState: "open",
        failureCount: 3,
        lastFailureTime: null,
        circuitOpenUntil: null,
        recoveryMinutes: null,
      },
    };
    const endpointCircuitInfo: ProviderEndpointCircuitInfoMap = {
      3: [
        {
          endpointId: 11,
          circuitState: "open",
          failureCount: 2,
          circuitOpenUntil: null,
        },
      ],
    };

    expect(
      summarizeProvidersForOperatorView({ providers, healthStatus, endpointCircuitInfo })
    ).toEqual({
      total: 3,
      active: 2,
      inactive: 1,
      groups: 3,
      attention: 2,
      scheduled: 1,
    });
  });

  test("uses default group for untagged providers and deduplicates repeated tags", () => {
    const providers = [
      buildProvider({ id: 1, groupTag: null }),
      buildProvider({ id: 2, groupTag: "alpha, alpha" }),
      buildProvider({ id: 3, groupTag: "default" }),
    ];

    expect(summarizeProvidersForOperatorView({ providers }).groups).toBe(2);
  });
});
