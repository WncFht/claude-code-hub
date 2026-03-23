import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EnvSnapshot = Partial<Record<string, string | undefined>>;

function snapshotEnv(keys: string[]): EnvSnapshot {
  const snapshot: EnvSnapshot = {};
  for (const key of keys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: EnvSnapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("instrumentation register", () => {
  const envKeys = [
    "NODE_ENV",
    "NEXT_RUNTIME",
    "CI",
    "REDIS_URL",
    "ENABLE_RATE_LIMIT",
    "AUTO_MIGRATE",
    "CCH_RUNTIME_BOOTSTRAP_LOCK_DIR",
  ];

  const originalEnv = snapshotEnv(envKeys);

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const initLangfuse = vi.fn(async () => {});
  const startCacheCleanup = vi.fn();
  const stopCacheCleanup = vi.fn();
  const subscribeCacheInvalidation = vi.fn(async () => () => {});
  const apiKeyVacuumFilter = {
    startBackgroundReload: vi.fn(),
    invalidateAndReload: vi.fn(),
  };
  const checkDatabaseConnection = vi.fn(async () => true);
  const runMigrations = vi.fn(async () => {});
  const withAdvisoryLock = vi.fn(async (_name: string, callback: () => Promise<void>) => {
    await callback();
    return { ran: true };
  });
  const backfillProviderVendorsFromProviders = vi.fn(async () => ({
    processed: 0,
    providersUpdated: 0,
    vendorsCreated: new Set<number>(),
    skippedInvalidUrl: 0,
  }));
  const backfillProviderEndpointsFromProviders = vi.fn(async () => ({
    inserted: 0,
    uniqueCandidates: 0,
    skippedInvalid: 0,
  }));
  const ensurePriceTable = vi.fn(async () => {});
  const requestCloudPriceTableSync = vi.fn();
  const syncDefaultErrorRules = vi.fn(async () => ({
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  }));
  const errorRuleDetectorReload = vi.fn(async () => {});
  const scheduleAutoCleanup = vi.fn(async () => {});
  const scheduleNotifications = vi.fn(async () => {});
  const startProbeScheduler = vi.fn();
  const isSmartProbingEnabled = vi.fn(() => false);
  const startEndpointProbeScheduler = vi.fn();
  const initEndpointCircuitBreaker = vi.fn(async () => {});
  const startEndpointProbeLogCleanup = vi.fn();
  let tempLockDir = "";

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();

    process.env.NODE_ENV = "production";
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.ENABLE_RATE_LIMIT = "true";
    process.env.AUTO_MIGRATE = "true";
    tempLockDir = mkdtempSync(path.join(os.tmpdir(), "cch-instrumentation-test-"));
    process.env.CCH_RUNTIME_BOOTSTRAP_LOCK_DIR = tempLockDir;
    delete process.env.CI;

    for (const mockFn of [
      logger.info,
      logger.warn,
      logger.error,
      logger.debug,
      initLangfuse,
      startCacheCleanup,
      stopCacheCleanup,
      subscribeCacheInvalidation,
      apiKeyVacuumFilter.startBackgroundReload,
      apiKeyVacuumFilter.invalidateAndReload,
      checkDatabaseConnection,
      runMigrations,
      withAdvisoryLock,
      backfillProviderVendorsFromProviders,
      backfillProviderEndpointsFromProviders,
      ensurePriceTable,
      requestCloudPriceTableSync,
      syncDefaultErrorRules,
      errorRuleDetectorReload,
      scheduleAutoCleanup,
      scheduleNotifications,
      startProbeScheduler,
      isSmartProbingEnabled,
      startEndpointProbeScheduler,
      initEndpointCircuitBreaker,
      startEndpointProbeLogCleanup,
    ]) {
      mockFn.mockReset();
    }

    subscribeCacheInvalidation.mockResolvedValue(() => {});
    checkDatabaseConnection.mockResolvedValue(true);
    withAdvisoryLock.mockImplementation(async (_name: string, callback: () => Promise<void>) => {
      await callback();
      return { ran: true };
    });
    backfillProviderVendorsFromProviders.mockResolvedValue({
      processed: 0,
      providersUpdated: 0,
      vendorsCreated: new Set<number>(),
      skippedInvalidUrl: 0,
    });
    backfillProviderEndpointsFromProviders.mockResolvedValue({
      inserted: 0,
      uniqueCandidates: 0,
      skippedInvalid: 0,
    });
    syncDefaultErrorRules.mockResolvedValue({
      inserted: 0,
      updated: 0,
      skipped: 0,
      deleted: 0,
    });
    isSmartProbingEnabled.mockReturnValue(false);

    vi.doMock("@/lib/logger", () => ({ logger }));
    vi.doMock("@/lib/langfuse", () => ({
      initLangfuse,
      shutdownLangfuse: vi.fn(async () => {}),
    }));
    vi.doMock("@/lib/cache/session-cache", () => ({
      startCacheCleanup,
      stopCacheCleanup,
    }));
    vi.doMock("@/lib/redis/pubsub", () => ({
      CHANNEL_API_KEYS_UPDATED: "cch:cache:api_keys:updated",
      subscribeCacheInvalidation,
    }));
    vi.doMock("@/lib/security/api-key-vacuum-filter", () => ({
      apiKeyVacuumFilter,
    }));
    vi.doMock("@/lib/migrate", () => ({
      checkDatabaseConnection,
      runMigrations,
      withAdvisoryLock,
    }));
    vi.doMock("@/repository/provider-endpoints", () => ({
      backfillProviderVendorsFromProviders,
      backfillProviderEndpointsFromProviders,
    }));
    vi.doMock("@/lib/price-sync/seed-initializer", () => ({
      ensurePriceTable,
    }));
    vi.doMock("@/lib/price-sync/cloud-price-updater", () => ({
      requestCloudPriceTableSync,
    }));
    vi.doMock("@/repository/error-rules", () => ({
      syncDefaultErrorRules,
    }));
    vi.doMock("@/lib/error-rule-detector", () => ({
      errorRuleDetector: {
        reload: errorRuleDetectorReload,
      },
    }));
    vi.doMock("@/lib/log-cleanup/cleanup-queue", () => ({
      scheduleAutoCleanup,
    }));
    vi.doMock("@/lib/notification/notification-queue", () => ({
      scheduleNotifications,
    }));
    vi.doMock("@/lib/circuit-breaker-probe", () => ({
      startProbeScheduler,
      isSmartProbingEnabled,
    }));
    vi.doMock("@/lib/provider-endpoints/probe-scheduler", () => ({
      startEndpointProbeScheduler,
      stopEndpointProbeScheduler: vi.fn(),
    }));
    vi.doMock("@/lib/endpoint-circuit-breaker", () => ({
      initEndpointCircuitBreaker,
    }));
    vi.doMock("@/lib/provider-endpoints/probe-log-cleanup", () => ({
      startEndpointProbeLogCleanup,
      stopEndpointProbeLogCleanup: vi.fn(),
    }));
    vi.doMock("@/lib/redis", () => ({
      closeRedis: vi.fn(async () => {}),
    }));
    vi.doMock("@/repository/message-write-buffer", () => ({
      stopMessageRequestWriteBuffer: vi.fn(async () => {}),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (tempLockDir) {
      rmSync(tempLockDir, { recursive: true, force: true });
      tempLockDir = "";
    }
    restoreEnv(originalEnv);
  });

  it("should not rerun heavy production bootstrap on repeated register calls", async () => {
    const { register } = await import("@/instrumentation");

    await register();
    await register();

    expect(checkDatabaseConnection).toHaveBeenCalledTimes(1);
    expect(runMigrations).toHaveBeenCalledTimes(1);
    expect(ensurePriceTable).toHaveBeenCalledTimes(1);
    expect(scheduleAutoCleanup).toHaveBeenCalledTimes(1);
    expect(scheduleNotifications).toHaveBeenCalledTimes(1);
    expect(startEndpointProbeScheduler).toHaveBeenCalledTimes(1);
  });
});
