import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEndpointPolicy } from "@/app/v1/_lib/proxy/endpoint-policy";
import { ProxyResponseHandler } from "@/app/v1/_lib/proxy/response-handler";
import { ProxySession } from "@/app/v1/_lib/proxy/session";
import { updateMessageRequestDetails } from "@/repository/message";
import { parseSSEData } from "@/lib/utils/sse";
import type { Provider } from "@/types/provider";

const asyncTasks: Promise<void>[] = [];

vi.mock("@/app/v1/_lib/proxy/response-fixer", () => ({
  ResponseFixer: {
    process: async (_session: unknown, response: Response) => response,
  },
}));

vi.mock("@/lib/async-task-manager", () => ({
  AsyncTaskManager: {
    register: (_taskId: string, promise: Promise<void>) => {
      asyncTasks.push(promise);
      return new AbortController();
    },
    cleanup: () => {},
    cancel: () => {},
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

vi.mock("@/lib/price-sync/cloud-price-updater", () => ({
  requestCloudPriceTableSync: vi.fn(),
}));

vi.mock("@/repository/model-price", () => ({
  findLatestPriceByModel: vi.fn(async () => null),
}));

vi.mock("@/repository/system-config", () => ({
  getSystemSettings: vi.fn(async () => ({ billingModelSource: "original" })),
}));

vi.mock("@/repository/message", () => ({
  updateMessageRequestCost: vi.fn(),
  updateMessageRequestDetails: vi.fn(),
  updateMessageRequestDuration: vi.fn(),
}));

vi.mock("@/lib/session-manager", () => ({
  SessionManager: {
    updateSessionUsage: vi.fn(async () => undefined),
    storeSessionResponse: vi.fn(async () => undefined),
    clearSessionProvider: vi.fn(async () => undefined),
    extractCodexPromptCacheKey: vi.fn(),
    updateSessionWithCodexCacheKey: vi.fn(async () => undefined),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  RateLimitService: {
    trackCost: vi.fn(),
    trackUserDailyCost: vi.fn(),
    decrementLeaseBudget: vi.fn(),
  },
}));

vi.mock("@/lib/session-tracker", () => ({
  SessionTracker: {
    refreshSession: vi.fn(),
  },
}));

vi.mock("@/lib/proxy-status-tracker", () => ({
  ProxyStatusTracker: {
    getInstance: () => ({
      endRequest: () => {},
    }),
  },
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 1,
    name: "codex-test",
    url: "https://example.com/v1",
    key: "sk-test",
    providerVendorId: null,
    isEnabled: true,
    weight: 1,
    priority: 0,
    groupPriorities: null,
    costMultiplier: 1,
    groupTag: null,
    providerType: "codex",
    preserveClientIp: false,
    modelRedirects: null,
    allowedModels: null,
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
    circuitBreakerOpenDuration: 1_800_000,
    circuitBreakerHalfOpenSuccessThreshold: 2,
    proxyUrl: null,
    proxyFallbackToDirect: false,
    firstByteTimeoutStreamingMs: 30_000,
    streamingIdleTimeoutMs: 60_000,
    requestTimeoutNonStreamingMs: 60_000,
    websiteUrl: null,
    faviconUrl: null,
    cacheTtlPreference: null,
    context1mPreference: null,
    codexReasoningEffortPreference: null,
    codexReasoningSummaryPreference: null,
    codexTextVerbosityPreference: null,
    codexParallelToolCallsPreference: null,
    anthropicMaxTokensPreference: null,
    anthropicThinkingBudgetPreference: null,
    geminiGoogleSearchPreference: null,
    swapCacheTtlBilling: false,
    tpm: 0,
    rpm: 0,
    rpd: 0,
    cc: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createSession(clientAbortSignal: AbortSignal): ProxySession {
  const session = Object.create(ProxySession.prototype) as ProxySession & {
    providerChain: Record<string, unknown>[];
  };
  const provider = createProvider();
  const user = { id: 1, name: "test-user", dailyResetTime: "00:00", dailyResetMode: "fixed" };
  const key = { id: 2, name: "test-key", dailyResetTime: "00:00", dailyResetMode: "fixed" };

  Object.assign(session, {
    request: {
      message: { model: "gpt-5", stream: true, input: [{ role: "user", content: "hi" }] },
      log: "(test)",
      model: "gpt-5",
    },
    startTime: Date.now(),
    method: "POST",
    requestUrl: new URL("http://localhost/v1/responses"),
    headers: new Headers(),
    originalHeaders: new Headers(),
    headerLog: "",
    userAgent: null,
    context: {},
    clientAbortSignal,
    userName: "test-user",
    authState: { user, key, apiKey: "sk-test", success: true },
    provider,
    messageContext: {
      id: 1,
      createdAt: new Date(),
      user,
      key,
      apiKey: "sk-test",
    },
    sessionId: "sess-1",
    requestSequence: 1,
    originalFormat: "response",
    providerType: null,
    originalModelName: null,
    originalUrlPathname: null,
    providerChain: [],
    cacheTtlResolved: null,
    context1mApplied: false,
    specialSettings: [],
    cachedPriceData: undefined,
    cachedBillingModelSource: undefined,
    endpointPolicy: resolveEndpointPolicy("/v1/responses"),
    ttfbMs: null,
    isHeaderModified: () => false,
    getContext1mApplied: () => false,
    getOriginalModel: () => "gpt-5",
    getCurrentModel: () => "gpt-5",
    getProviderChain: () => session.providerChain,
    getSpecialSettings: () => [],
    getResolvedPricingByBillingSource: async () => null,
    getEndpointPolicy: () => resolveEndpointPolicy("/v1/responses"),
    recordTtfb: () => {
      session.ttfbMs = 12;
      return 12;
    },
    addProviderToChain: (prov: Provider, metadata?: Record<string, unknown>) => {
      session.providerChain.push({
        id: prov.id,
        name: prov.name,
        providerType: prov.providerType,
        ...(metadata ?? {}),
      });
    },
  });

  return session;
}

function createResponseCreatedChunk(): Uint8Array {
  return new TextEncoder().encode(
    'data: {"type":"response.created","id":"resp_1","object":"response","created":123,"model":"gpt-5","status":"generating"}\n\n'
  );
}

async function drainAsyncTasks(): Promise<void> {
  await Promise.allSettled(asyncTasks);
  asyncTasks.length = 0;
}

describe("Response API synthetic failure terminal event", () => {
  beforeEach(() => {
    asyncTasks.length = 0;
    vi.clearAllMocks();
  });

  it("appends synthetic response.failed when upstream aborts mid-stream", async () => {
    let step = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (step === 0) {
          step += 1;
          controller.enqueue(createResponseCreatedChunk());
          return;
        }

        const error = new Error("socket closed unexpectedly");
        error.name = "ResponseAborted";
        controller.error(error);
      },
    });

    const session = createSession(new AbortController().signal);
    const handled = await ProxyResponseHandler.dispatch(
      session,
      new Response(stream, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      })
    );

    const text = await handled.text();
    await drainAsyncTasks();

    const events = parseSSEData(text);
    const typedEvents = events
      .map((event) =>
        typeof event.data === "object" && event.data
          ? (event.data as Record<string, unknown>)
          : null
      )
      .filter((event): event is Record<string, unknown> => event !== null);

    expect(typedEvents.map((event) => event.type)).toEqual(["response.created", "response.failed"]);
    expect(typedEvents[1]).toMatchObject({
      type: "response.failed",
      status: "failed",
      cch_synthetic: true,
      id: "resp_1",
      model: "gpt-5",
      created: 123,
      error: {
        code: "stream_upstream_aborted",
      },
    });
    expect(updateMessageRequestDetails).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        statusCode: 502,
        errorMessage: "STREAM_UPSTREAM_ABORTED",
        errorStack: expect.any(String),
      })
    );
  });

  it("does not append synthetic response.failed for real client abort", async () => {
    const clientAbortController = new AbortController();
    let step = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (step === 0) {
          step += 1;
          controller.enqueue(createResponseCreatedChunk());
          queueMicrotask(() => clientAbortController.abort());
          return;
        }

        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        controller.error(error);
      },
    });

    const session = createSession(clientAbortController.signal);
    const handled = await ProxyResponseHandler.dispatch(
      session,
      new Response(stream, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      })
    );

    const text = await handled.text();
    await drainAsyncTasks();

    const events = parseSSEData(text);
    const typedEvents = events
      .map((event) =>
        typeof event.data === "object" && event.data
          ? (event.data as Record<string, unknown>)
          : null
      )
      .filter((event): event is Record<string, unknown> => event !== null);

    expect(typedEvents.map((event) => event.type)).toEqual(["response.created"]);
    expect(updateMessageRequestDetails).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
      })
    );
  });
});
