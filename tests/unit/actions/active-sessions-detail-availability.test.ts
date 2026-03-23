import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const getSessionMock = vi.fn();

const getSessionDetailsCacheMock = vi.fn();
const setSessionDetailsCacheMock = vi.fn();

const getSessionRequestCountMock = vi.fn();
const getSessionRequestBodyMock = vi.fn();
const getSessionMessagesMock = vi.fn();
const getSessionResponseMock = vi.fn();
const getSessionRequestHeadersMock = vi.fn();
const getSessionResponseHeadersMock = vi.fn();
const getSessionClientRequestMetaMock = vi.fn();
const getSessionUpstreamRequestMetaMock = vi.fn();
const getSessionUpstreamResponseMetaMock = vi.fn();
const getSessionSpecialSettingsMock = vi.fn();

const aggregateSessionStatsMock = vi.fn();
const findAdjacentRequestSequencesMock = vi.fn();
const findMessageRequestAuditBySessionIdAndSequenceMock = vi.fn();

const ORIGINAL_SESSION_TTL = process.env.SESSION_TTL;

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/cache/session-cache", () => ({
  getActiveSessionsCache: vi.fn(() => null),
  setActiveSessionsCache: vi.fn(),
  getSessionDetailsCache: getSessionDetailsCacheMock,
  setSessionDetailsCache: setSessionDetailsCacheMock,
  clearActiveSessionsCache: vi.fn(),
  clearSessionDetailsCache: vi.fn(),
  clearAllSessionsQueryCache: vi.fn(),
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

vi.mock("@/lib/session-manager", () => ({
  SessionManager: {
    getSessionRequestCount: getSessionRequestCountMock,
    getSessionRequestBody: getSessionRequestBodyMock,
    getSessionMessages: getSessionMessagesMock,
    getSessionResponse: getSessionResponseMock,
    getSessionRequestHeaders: getSessionRequestHeadersMock,
    getSessionResponseHeaders: getSessionResponseHeadersMock,
    getSessionClientRequestMeta: getSessionClientRequestMetaMock,
    getSessionUpstreamRequestMeta: getSessionUpstreamRequestMetaMock,
    getSessionUpstreamResponseMeta: getSessionUpstreamResponseMetaMock,
    getSessionSpecialSettings: getSessionSpecialSettingsMock,
  },
}));

vi.mock("@/repository/message", () => ({
  aggregateSessionStats: aggregateSessionStatsMock,
  findAdjacentRequestSequences: findAdjacentRequestSequencesMock,
  findMessageRequestAuditBySessionIdAndSequence: findMessageRequestAuditBySessionIdAndSequenceMock,
}));

describe("getSessionDetails - detail availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.SESSION_TTL = "300";

    getSessionMock.mockResolvedValue({ user: { id: 1, role: "admin" } });
    getSessionDetailsCacheMock.mockReturnValue(null);

    aggregateSessionStatsMock.mockResolvedValue({
      sessionId: "sess_x",
      requestCount: 2,
      totalCostUsd: "0",
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      totalDurationMs: 0,
      firstRequestAt: new Date("2026-03-23T08:58:00.000Z"),
      lastRequestAt: new Date("2026-03-23T09:00:00.000Z"),
      providers: [],
      models: [],
      userName: "u",
      userId: 1,
      keyName: "k",
      keyId: 1,
      userAgent: "Claude-Code/1.0",
      apiType: "chat",
      cacheTtlApplied: null,
    });

    findAdjacentRequestSequencesMock.mockResolvedValue({ prevSequence: 1, nextSequence: null });

    getSessionRequestCountMock.mockResolvedValue(2);
    getSessionRequestBodyMock.mockResolvedValue(null);
    getSessionMessagesMock.mockResolvedValue(null);
    getSessionResponseMock.mockResolvedValue(null);
    getSessionRequestHeadersMock.mockResolvedValue(null);
    getSessionResponseHeadersMock.mockResolvedValue(null);
    getSessionClientRequestMetaMock.mockResolvedValue(null);
    getSessionUpstreamRequestMetaMock.mockResolvedValue(null);
    getSessionUpstreamResponseMetaMock.mockResolvedValue(null);
    getSessionSpecialSettingsMock.mockResolvedValue(null);
    findMessageRequestAuditBySessionIdAndSequenceMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (ORIGINAL_SESSION_TTL === undefined) {
      delete process.env.SESSION_TTL;
      return;
    }
    process.env.SESSION_TTL = ORIGINAL_SESSION_TTL;
  });

  test("marks Redis-backed request details as expired once SESSION_TTL has elapsed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T09:10:00.000Z"));

    const { getSessionDetails } = await import("@/actions/active-sessions");
    const result = await getSessionDetails("sess_x", 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.detailAvailability).toEqual({
      reason: "expired",
      missingAllDetails: true,
      ttlSeconds: 300,
      lastRequestAt: new Date("2026-03-23T09:00:00.000Z"),
      expiredAt: new Date("2026-03-23T09:05:00.000Z"),
    });
  });

  test("marks details as expired when lastRequestAt comes back as a timestamp string", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T09:15:00.000Z"));

    aggregateSessionStatsMock.mockResolvedValue({
      sessionId: "sess_x",
      requestCount: 2,
      totalCostUsd: "0",
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      totalDurationMs: 0,
      firstRequestAt: "2026-03-23 16:58:00+08",
      lastRequestAt: "2026-03-23 17:07:31.65667+08",
      providers: [],
      models: [],
      userName: "u",
      userId: 1,
      keyName: "k",
      keyId: 1,
      userAgent: "Claude-Code/1.0",
      apiType: "chat",
      cacheTtlApplied: null,
    });

    const { getSessionDetails } = await import("@/actions/active-sessions");
    const result = await getSessionDetails("sess_x", 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.detailAvailability.reason).toBe("expired");
    expect(result.data.detailAvailability.expiredAt).toEqual(new Date("2026-03-23T09:12:31.656Z"));
  });
});
