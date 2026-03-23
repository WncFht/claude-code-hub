import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/logger", () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/v1/_lib/proxy/errors", () => ({
  sanitizeHeaders: vi.fn(() => "(empty)"),
  sanitizeUrl: vi.fn((value: unknown) => String(value)),
}));

vi.mock("@/lib/session-tracker", () => ({
  SessionTracker: class SessionTracker {},
}));

class MockRedis extends EventEmitter {
  status = "connecting";
  get = vi.fn();
}

let redisMock: MockRedis | null = null;

vi.mock("@/lib/redis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/redis")>();
  return {
    ...actual,
    getRedisClient: () => redisMock,
  };
});

describe("SessionManager Redis readiness", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    redisMock = new MockRedis();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    redisMock = null;
  });

  test("getSessionMessages waits briefly for Redis to become ready", async () => {
    redisMock?.get.mockResolvedValueOnce('[{"role":"user","content":"[REDACTED]"}]');

    const { SessionManager } = await import("@/lib/session-manager");

    const resultPromise = SessionManager.getSessionMessages("sess_ready", 2);

    setTimeout(() => {
      if (!redisMock) return;
      redisMock.status = "ready";
      redisMock.emit("ready");
    }, 50);

    await vi.advanceTimersByTimeAsync(50);

    await expect(resultPromise).resolves.toEqual([{ role: "user", content: "[REDACTED]" }]);
    expect(redisMock?.get).toHaveBeenCalledWith("session:sess_ready:req:2:messages");
  });

  test("getSessionRequestCount waits briefly for Redis to become ready", async () => {
    redisMock?.get.mockResolvedValueOnce("11");

    const { SessionManager } = await import("@/lib/session-manager");

    const resultPromise = SessionManager.getSessionRequestCount("sess_ready");

    setTimeout(() => {
      if (!redisMock) return;
      redisMock.status = "ready";
      redisMock.emit("ready");
    }, 50);

    await vi.advanceTimersByTimeAsync(50);

    await expect(resultPromise).resolves.toBe(11);
    expect(redisMock?.get).toHaveBeenCalledWith("session:sess_ready:seq");
  });
});
