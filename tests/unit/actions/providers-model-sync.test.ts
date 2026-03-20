import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findProviderByIdMock = vi.fn();
const updateProviderMock = vi.fn();
const publishProviderCacheInvalidationMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/repository/provider", () => ({
  createProvider: vi.fn(),
  deleteProvider: vi.fn(),
  findAllProviders: vi.fn(async () => []),
  findAllProvidersFresh: vi.fn(async () => []),
  findProviderById: findProviderByIdMock,
  getProviderStatistics: vi.fn(async () => []),
  resetProviderTotalCostResetAt: vi.fn(async () => {}),
  updateProvider: updateProviderMock,
  updateProviderPrioritiesBatch: vi.fn(async () => 0),
  updateProvidersBatch: vi.fn(async () => 0),
}));

vi.mock("@/repository", () => ({
  restoreProvidersBatch: vi.fn(async () => ({ restoredCount: 0, restoredIds: [] })),
}));

vi.mock("@/repository/provider-endpoints", () => ({
  backfillProviderEndpointsFromProviders: vi.fn(async () => ({ ok: true })),
  computeVendorKey: vi.fn(),
  findProviderVendorsByIds: vi.fn(async () => []),
  getOrCreateProviderVendorIdFromUrls: vi.fn(async () => 1),
  tryDeleteProviderVendorIfEmpty: vi.fn(async () => {}),
}));

vi.mock("@/lib/cache/provider-cache", () => ({
  publishProviderCacheInvalidation: publishProviderCacheInvalidationMock,
}));

vi.mock("@/lib/circuit-breaker", () => ({
  clearConfigCache: vi.fn(),
  clearProviderState: vi.fn(),
  forceCloseCircuitState: vi.fn(),
  getAllHealthStatusAsync: vi.fn(async () => ({})),
  publishCircuitBreakerConfigInvalidation: vi.fn(),
  resetCircuit: vi.fn(),
}));

vi.mock("@/lib/provider-testing", () => ({
  executeProviderTest: vi.fn(),
}));

vi.mock("@/lib/provider-testing/presets", () => ({
  getPresetsForProvider: vi.fn(async () => []),
}));

vi.mock("@/lib/redis/circuit-breaker-config", () => ({
  deleteProviderCircuitConfig: vi.fn(),
  saveProviderCircuitConfig: vi.fn(),
}));

vi.mock("@/lib/redis/redis-kv-store", () => ({
  RedisKVStore: class {},
}));

vi.mock("@/lib/session-manager", () => ({
  SessionManager: {
    terminateProviderSessionsBatch: vi.fn(async () => 0),
    terminateStickySessionsForProviders: vi.fn(async () => 0),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Prism OpenAI",
    url: "https://provider.example.com",
    key: "sk-provider-test",
    providerVendorId: null,
    isEnabled: true,
    weight: 1,
    priority: 0,
    groupPriorities: null,
    costMultiplier: 1,
    groupTag: null,
    providerType: "openai-compatible",
    preserveClientIp: false,
    modelRedirects: null,
    allowedModels: ["gpt-4.1"],
    discoveredModels: ["gpt-4o-mini"],
    modelDiscoveryStatus: "success",
    lastModelSyncAt: new Date("2026-03-18T00:00:00.000Z"),
    lastModelSyncError: null,
    allowedClients: [],
    blockedClients: [],
    activeTimeStart: null,
    activeTimeEnd: null,
    mcpPassthroughType: "none",
    mcpPassthroughUrl: null,
    limit5hUsd: null,
    limitDailyUsd: null,
    dailyResetMode: "fixed",
    dailyResetTime: "00:00",
    limitWeeklyUsd: null,
    limitMonthlyUsd: null,
    limitTotalUsd: null,
    totalCostResetAt: null,
    limitConcurrentSessions: 0,
    maxRetryAttempts: null,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerOpenDuration: 1800000,
    circuitBreakerHalfOpenSuccessThreshold: 2,
    proxyUrl: null,
    proxyFallbackToDirect: false,
    firstByteTimeoutStreamingMs: 30000,
    streamingIdleTimeoutMs: 60000,
    requestTimeoutNonStreamingMs: 120000,
    websiteUrl: null,
    faviconUrl: null,
    cacheTtlPreference: null,
    swapCacheTtlBilling: false,
    context1mPreference: null,
    codexReasoningEffortPreference: null,
    codexReasoningSummaryPreference: null,
    codexTextVerbosityPreference: null,
    codexParallelToolCallsPreference: null,
    codexServiceTierPreference: null,
    anthropicMaxTokensPreference: null,
    anthropicThinkingBudgetPreference: null,
    anthropicAdaptiveThinking: null,
    geminiGoogleSearchPreference: null,
    tpm: null,
    rpm: null,
    rpd: null,
    cc: null,
    createdAt: new Date("2026-03-18T00:00:00.000Z"),
    updatedAt: new Date("2026-03-18T00:00:00.000Z"),
    ...overrides,
  };
}

describe("syncProviderModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: 1, role: "admin" } });
    publishProviderCacheInvalidationMock.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("persists a successful upstream model snapshot", async () => {
    const provider = makeProvider({
      discoveredModels: null,
      modelDiscoveryStatus: null,
      lastModelSyncAt: null,
      lastModelSyncError: null,
    });

    findProviderByIdMock.mockResolvedValue(provider);
    updateProviderMock.mockImplementation(
      async (_id: number, payload: Record<string, unknown>) => ({
        ...provider,
        discoveredModels: payload.discovered_models,
        modelDiscoveryStatus: payload.model_discovery_status,
        lastModelSyncAt: payload.last_model_sync_at,
        lastModelSyncError: payload.last_model_sync_error,
      })
    );
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "gpt-4.1-mini" }, { id: "gpt-4.1" }],
      }),
    } as Response);

    const { syncProviderModels } = await import("@/actions/providers");
    const result = await syncProviderModels(1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(updateProviderMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        discovered_models: ["gpt-4.1", "gpt-4.1-mini"],
        model_discovery_status: "success",
        last_model_sync_at: expect.any(Date),
        last_model_sync_error: null,
      })
    );
    expect(result.data).toEqual(
      expect.objectContaining({
        providerId: 1,
        status: "success",
        discoveredModels: ["gpt-4.1", "gpt-4.1-mini"],
        lastModelSyncError: null,
      })
    );
    expect(publishProviderCacheInvalidationMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the previous snapshot and records error metadata when upstream sync fails", async () => {
    const provider = makeProvider({
      discoveredModels: ["gpt-4o-mini", "gpt-4.1"],
      modelDiscoveryStatus: "success",
      lastModelSyncAt: new Date("2026-03-18T00:00:00.000Z"),
      lastModelSyncError: null,
    });

    findProviderByIdMock.mockResolvedValue(provider);
    updateProviderMock.mockImplementation(
      async (_id: number, payload: Record<string, unknown>) => ({
        ...provider,
        discoveredModels: payload.discovered_models,
        modelDiscoveryStatus: payload.model_discovery_status,
        lastModelSyncAt: payload.last_model_sync_at,
        lastModelSyncError: payload.last_model_sync_error,
      })
    );
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "service unavailable",
    } as Response);

    const { syncProviderModels } = await import("@/actions/providers");
    const result = await syncProviderModels(1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(updateProviderMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        discovered_models: ["gpt-4o-mini", "gpt-4.1"],
        model_discovery_status: "error",
        last_model_sync_at: expect.any(Date),
        last_model_sync_error: expect.stringContaining("HTTP 503"),
      })
    );
    expect(result.data).toEqual(
      expect.objectContaining({
        providerId: 1,
        status: "error",
        discoveredModels: ["gpt-4o-mini", "gpt-4.1"],
        lastModelSyncError: expect.stringContaining("HTTP 503"),
      })
    );
  });

  it.each([
    {
      providerType: "openai-compatible" as const,
      providerUrl: "https://provider.example.com/openai/responses",
      expectedUrl: "https://provider.example.com/openai/models",
    },
    {
      providerType: "claude" as const,
      providerUrl: "https://provider.example.com/anthropic/v1/messages",
      expectedUrl: "https://provider.example.com/anthropic/v1/models",
    },
  ])("replaces saved endpoint roots before fetching upstream models for $providerType providers", async ({
    providerType,
    providerUrl,
    expectedUrl,
  }) => {
    const provider = makeProvider({
      providerType,
      url: providerUrl,
      discoveredModels: null,
      modelDiscoveryStatus: null,
      lastModelSyncAt: null,
      lastModelSyncError: null,
    });

    findProviderByIdMock.mockResolvedValue(provider);
    updateProviderMock.mockImplementation(
      async (_id: number, payload: Record<string, unknown>) => ({
        ...provider,
        discoveredModels: payload.discovered_models,
        modelDiscoveryStatus: payload.model_discovery_status,
        lastModelSyncAt: payload.last_model_sync_at,
        lastModelSyncError: payload.last_model_sync_error,
      })
    );
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "model-a" }],
      }),
    } as Response);

    const { syncProviderModels } = await import("@/actions/providers");
    const result = await syncProviderModels(1);

    expect(result.ok).toBe(true);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });
});
