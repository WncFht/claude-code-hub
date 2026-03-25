/**
 * Provider Availability Aggregation Service
 * Calculates availability metrics from request logs
 * Simple two-tier status: success (green) or failure (red)
 */

import { and, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { messageRequest, providers } from "@/drizzle/schema";
import {
  type ClientAbortOutcome,
  isLocalClientAbortStatus,
} from "@/lib/client-abort-observability";
import { logger } from "@/lib/logger";
import type {
  AvailabilityQueryOptions,
  AvailabilityQueryResult,
  AvailabilityStatus,
  ClientAbortCounters,
  ProviderAvailabilitySummary,
  RequestStatusClassification,
  TimeBucketMetrics,
} from "./types";
import { EMPTY_CLIENT_ABORT_COUNTERS } from "./types";

// Maximum requests to load per query to prevent OOM
const MAX_REQUESTS_PER_QUERY = 100000;

/**
 * Classify a single request's status
 * Simple: success (2xx/3xx) = green, failure = red
 */
export function classifyRequestStatus(params: {
  statusCode: number | null;
  errorMessage: string | null;
  clientAbortOutcome: ClientAbortOutcome | null;
  clientAbortLongRunning: boolean | null;
}): RequestStatusClassification {
  const { statusCode, errorMessage, clientAbortOutcome, clientAbortLongRunning } = params;

  if (clientAbortOutcome && isLocalClientAbortStatus(statusCode, errorMessage)) {
    return {
      status: "unknown",
      isSuccess: false,
      isError: false,
      countsTowardAvailability: false,
      countsTowardClientAbort: true,
      clientAbortOutcome,
      clientAbortLongRunning: clientAbortLongRunning === true,
    };
  }

  // No status code means network error or timeout
  if (statusCode === null) {
    return {
      status: "red",
      isSuccess: false,
      isError: true,
      countsTowardAvailability: true,
      countsTowardClientAbort: false,
      clientAbortLongRunning: false,
    };
  }

  // HTTP error (4xx/5xx)
  if (statusCode >= 400) {
    return {
      status: "red",
      isSuccess: false,
      isError: true,
      countsTowardAvailability: true,
      countsTowardClientAbort: false,
      clientAbortLongRunning: false,
    };
  }

  // HTTP success (2xx/3xx) - all successful requests are green
  return {
    status: "green",
    isSuccess: true,
    isError: false,
    countsTowardAvailability: true,
    countsTowardClientAbort: false,
    clientAbortLongRunning: false,
  };
}

function createEmptyClientAbortCounters(): ClientAbortCounters {
  return { ...EMPTY_CLIENT_ABORT_COUNTERS };
}

function incrementClientAbortCounters(
  counters: ClientAbortCounters,
  classification: RequestStatusClassification
): void {
  if (!classification.countsTowardClientAbort || !classification.clientAbortOutcome) {
    return;
  }

  counters.total += 1;

  if (classification.clientAbortOutcome === "session_continued") {
    counters.sessionContinued += 1;
  } else if (classification.clientAbortOutcome === "after_stream_start") {
    counters.afterStreamStart += 1;
  } else if (classification.clientAbortOutcome === "before_stream_start") {
    counters.beforeStreamStart += 1;
  }

  if (classification.clientAbortLongRunning) {
    counters.longRunning += 1;
  }
}

/**
 * Calculate availability score from counts (simple: green / total)
 */
export function calculateAvailabilityScore(greenCount: number, redCount: number): number {
  const total = greenCount + redCount;
  if (total === 0) return 0;

  return greenCount / total;
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

/**
 * Determine optimal time bucket size based on data density
 */
export function determineOptimalBucketSize(
  _totalRequests: number,
  timeRangeMinutes: number
): number {
  // Target: 20-100 data points per time series for good visualization
  const targetBuckets = 50;
  const idealBucketMinutes = timeRangeMinutes / targetBuckets;

  // Round to nearest standard bucket size
  const standardSizes = [1, 5, 15, 60, 1440]; // 1min, 5min, 15min, 1hour, 1day

  for (const size of standardSizes) {
    if (idealBucketMinutes <= size) {
      return size;
    }
  }

  return 1440; // Default to daily for very long ranges
}

/**
 * Query availability data for providers
 */
export async function queryProviderAvailability(
  options: AvailabilityQueryOptions = {}
): Promise<AvailabilityQueryResult> {
  const now = new Date();
  const {
    startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000), // Default: last 24 hours
    endTime = now,
    providerIds = [],
    bucketSizeMinutes: explicitBucketSize,
    includeDisabled = false,
    maxBuckets = 100,
  } = options;

  const startDate = typeof startTime === "string" ? new Date(startTime) : startTime;
  const endDate = typeof endTime === "string" ? new Date(endTime) : endTime;
  const timeRangeMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

  // Get provider list
  const providerConditions = [isNull(providers.deletedAt)];
  if (!includeDisabled) {
    providerConditions.push(eq(providers.isEnabled, true));
  }
  if (providerIds.length > 0) {
    providerConditions.push(inArray(providers.id, providerIds));
  }

  const providerList = await db
    .select({
      id: providers.id,
      name: providers.name,
      providerType: providers.providerType,
      enabled: providers.isEnabled,
    })
    .from(providers)
    .where(and(...providerConditions));

  if (providerList.length === 0) {
    return {
      queriedAt: now.toISOString(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      bucketSizeMinutes: explicitBucketSize ?? 60,
      providers: [],
      systemAvailability: 0,
      clientAbortCounts: createEmptyClientAbortCounters(),
    };
  }

  const providerIdList = providerList.map((p) => p.id);

  // Query raw request data
  const requestConditions = [
    inArray(messageRequest.providerId, providerIdList),
    gte(messageRequest.createdAt, startDate),
    lte(messageRequest.createdAt, endDate),
    isNull(messageRequest.deletedAt),
  ];

  const requests = await db
    .select({
      id: messageRequest.id,
      providerId: messageRequest.providerId,
      statusCode: messageRequest.statusCode,
      durationMs: messageRequest.durationMs,
      errorMessage: messageRequest.errorMessage,
      clientAbortOutcome: messageRequest.clientAbortOutcome,
      clientAbortLongRunning: messageRequest.clientAbortLongRunning,
      createdAt: messageRequest.createdAt,
    })
    .from(messageRequest)
    .where(and(...requestConditions))
    .orderBy(messageRequest.createdAt)
    .limit(MAX_REQUESTS_PER_QUERY);

  // Warn if query hit the limit - results may be incomplete
  if (requests.length === MAX_REQUESTS_PER_QUERY) {
    logger.warn("[Availability] Query hit max request limit, results may be incomplete", {
      limit: MAX_REQUESTS_PER_QUERY,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  }

  // Determine bucket size if not explicitly specified
  // Ensure minimum bucket size of 0.25 minutes (15 seconds) to prevent division by zero
  // Handle NaN case (nullish coalescing doesn't catch NaN from invalid parseFloat input)
  const rawBucketSize =
    explicitBucketSize ?? determineOptimalBucketSize(requests.length, timeRangeMinutes);
  const bucketSizeMinutes = Number.isNaN(rawBucketSize)
    ? determineOptimalBucketSize(requests.length, timeRangeMinutes)
    : Math.max(0.25, rawBucketSize);
  const bucketSizeMs = bucketSizeMinutes * 60 * 1000;

  // Group requests by provider and time bucket
  const providerBuckets = new Map<
    number,
    Map<
      string,
      {
        greenCount: number;
        redCount: number;
        clientAbortCounts: ClientAbortCounters;
        latencies: number[];
      }
    >
  >();

  // Initialize provider buckets
  for (const provider of providerList) {
    providerBuckets.set(provider.id, new Map());
  }

  // Process requests
  for (const req of requests) {
    if (!req.createdAt) continue;

    const bucketStart = new Date(Math.floor(req.createdAt.getTime() / bucketSizeMs) * bucketSizeMs);
    const bucketKey = bucketStart.toISOString();

    const providerData = providerBuckets.get(req.providerId);
    if (!providerData) continue;

    if (!providerData.has(bucketKey)) {
      providerData.set(bucketKey, {
        greenCount: 0,
        redCount: 0,
        clientAbortCounts: createEmptyClientAbortCounters(),
        latencies: [],
      });
    }

    const bucket = providerData.get(bucketKey)!;
    const classification = classifyRequestStatus({
      statusCode: req.statusCode,
      errorMessage: req.errorMessage,
      clientAbortOutcome: req.clientAbortOutcome,
      clientAbortLongRunning: req.clientAbortLongRunning,
    });

    if (classification.status === "green" && classification.countsTowardAvailability) {
      bucket.greenCount++;
    } else if (classification.status === "red" && classification.countsTowardAvailability) {
      bucket.redCount++;
    }

    incrementClientAbortCounters(bucket.clientAbortCounts, classification);

    if (req.durationMs !== null) {
      bucket.latencies.push(req.durationMs);
    }
  }

  // Build provider summaries
  const providerSummaries: ProviderAvailabilitySummary[] = [];

  for (const provider of providerList) {
    const bucketData = providerBuckets.get(provider.id)!;
    const timeBuckets: TimeBucketMetrics[] = [];

    let totalGreen = 0;
    let totalRed = 0;
    const totalClientAbortCounts = createEmptyClientAbortCounters();
    const allLatencies: number[] = [];
    let lastRequestAt: string | null = null;

    // Sort buckets by time and limit
    const sortedBucketKeys = Array.from(bucketData.keys()).sort().slice(-maxBuckets);

    for (const bucketKey of sortedBucketKeys) {
      const bucket = bucketData.get(bucketKey)!;
      const bucketStart = new Date(bucketKey);
      const bucketEnd = new Date(bucketStart.getTime() + bucketSizeMs);

      totalGreen += bucket.greenCount;
      totalRed += bucket.redCount;
      totalClientAbortCounts.total += bucket.clientAbortCounts.total;
      totalClientAbortCounts.sessionContinued += bucket.clientAbortCounts.sessionContinued;
      totalClientAbortCounts.afterStreamStart += bucket.clientAbortCounts.afterStreamStart;
      totalClientAbortCounts.beforeStreamStart += bucket.clientAbortCounts.beforeStreamStart;
      totalClientAbortCounts.longRunning += bucket.clientAbortCounts.longRunning;
      allLatencies.push(...bucket.latencies);

      const sortedLatencies = [...bucket.latencies].sort((a, b) => a - b);
      const total = bucket.greenCount + bucket.redCount;

      timeBuckets.push({
        bucketStart: bucketStart.toISOString(),
        bucketEnd: bucketEnd.toISOString(),
        totalRequests: total,
        greenCount: bucket.greenCount,
        redCount: bucket.redCount,
        clientAbortCounts: { ...bucket.clientAbortCounts },
        availabilityScore: calculateAvailabilityScore(bucket.greenCount, bucket.redCount),
        avgLatencyMs:
          sortedLatencies.length > 0
            ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length
            : 0,
        p50LatencyMs: calculatePercentile(sortedLatencies, 50),
        p95LatencyMs: calculatePercentile(sortedLatencies, 95),
        p99LatencyMs: calculatePercentile(sortedLatencies, 99),
      });

      // Track last request time
      if (bucket.latencies.length > 0) {
        lastRequestAt = bucketEnd.toISOString();
      }
    }

    const totalRequests = totalGreen + totalRed;
    const sortedAllLatencies = allLatencies.sort((a, b) => a - b);

    // Determine current status based on last few buckets
    // IMPORTANT: No data = 'unknown', NOT 'green'! Must be honest.
    let currentStatus: AvailabilityStatus = "unknown";
    if (timeBuckets.length > 0) {
      const recentBuckets = timeBuckets.slice(-3); // Last 3 buckets
      const recentScore =
        recentBuckets.reduce((sum, b) => sum + b.availabilityScore, 0) / recentBuckets.length;

      // Simple: >= 50% success = green, otherwise red
      currentStatus = recentScore >= 0.5 ? "green" : "red";
    }

    providerSummaries.push({
      providerId: provider.id,
      providerName: provider.name,
      providerType: provider.providerType ?? "claude",
      isEnabled: provider.enabled ?? true,
      currentStatus,
      currentAvailability: calculateAvailabilityScore(totalGreen, totalRed),
      totalRequests,
      successRate: totalRequests > 0 ? totalGreen / totalRequests : 0,
      clientAbortCounts: totalClientAbortCounts,
      avgLatencyMs:
        sortedAllLatencies.length > 0
          ? sortedAllLatencies.reduce((a, b) => a + b, 0) / sortedAllLatencies.length
          : 0,
      lastRequestAt,
      timeBuckets,
    });
  }

  // Calculate system-wide availability
  const totalSystemRequests = providerSummaries.reduce((sum, p) => sum + p.totalRequests, 0);
  const systemClientAbortCounts = createEmptyClientAbortCounters();
  for (const summary of providerSummaries) {
    systemClientAbortCounts.total += summary.clientAbortCounts.total;
    systemClientAbortCounts.sessionContinued += summary.clientAbortCounts.sessionContinued;
    systemClientAbortCounts.afterStreamStart += summary.clientAbortCounts.afterStreamStart;
    systemClientAbortCounts.beforeStreamStart += summary.clientAbortCounts.beforeStreamStart;
    systemClientAbortCounts.longRunning += summary.clientAbortCounts.longRunning;
  }
  const weightedSystemAvailability =
    totalSystemRequests > 0
      ? providerSummaries.reduce((sum, p) => sum + p.currentAvailability * p.totalRequests, 0) /
        totalSystemRequests
      : 0;

  return {
    queriedAt: now.toISOString(),
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    bucketSizeMinutes,
    providers: providerSummaries,
    systemAvailability: weightedSystemAvailability,
    clientAbortCounts: systemClientAbortCounts,
  };
}

/**
 * Get current availability status for all providers (lightweight query)
 */
export async function getCurrentProviderStatus(): Promise<
  Array<{
    providerId: number;
    providerName: string;
    status: AvailabilityStatus;
    availability: number;
    requestCount: number;
    lastRequestAt: string | null;
  }>
> {
  // Query last 15 minutes of data for current status
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Get enabled providers
  const providerList = await db
    .select({
      id: providers.id,
      name: providers.name,
    })
    .from(providers)
    .where(and(eq(providers.isEnabled, true), isNull(providers.deletedAt)));

  if (providerList.length === 0) {
    return [];
  }

  const providerIdList = providerList.map((p) => p.id);

  // Query recent requests
  const requests = await db
    .select({
      providerId: messageRequest.providerId,
      statusCode: messageRequest.statusCode,
      durationMs: messageRequest.durationMs,
      errorMessage: messageRequest.errorMessage,
      clientAbortOutcome: messageRequest.clientAbortOutcome,
      clientAbortLongRunning: messageRequest.clientAbortLongRunning,
      createdAt: messageRequest.createdAt,
    })
    .from(messageRequest)
    .where(
      and(
        inArray(messageRequest.providerId, providerIdList),
        gte(messageRequest.createdAt, fifteenMinutesAgo),
        isNull(messageRequest.deletedAt)
      )
    )
    .orderBy(desc(messageRequest.createdAt));

  // Aggregate by provider
  const providerStats = new Map<
    number,
    {
      greenCount: number;
      redCount: number;
      lastRequestAt: string | null;
    }
  >();

  for (const provider of providerList) {
    providerStats.set(provider.id, {
      greenCount: 0,
      redCount: 0,
      lastRequestAt: null,
    });
  }

  for (const req of requests) {
    const stats = providerStats.get(req.providerId);
    if (!stats) continue;

    const classification = classifyRequestStatus({
      statusCode: req.statusCode,
      errorMessage: req.errorMessage,
      clientAbortOutcome: req.clientAbortOutcome,
      clientAbortLongRunning: req.clientAbortLongRunning,
    });

    if (classification.status === "green" && classification.countsTowardAvailability) {
      stats.greenCount++;
    } else if (classification.status === "red" && classification.countsTowardAvailability) {
      stats.redCount++;
    }

    if (!stats.lastRequestAt && req.createdAt) {
      stats.lastRequestAt = req.createdAt.toISOString();
    }
  }

  return providerList.map((provider) => {
    const stats = providerStats.get(provider.id)!;
    const total = stats.greenCount + stats.redCount;
    const availability = calculateAvailabilityScore(stats.greenCount, stats.redCount);

    // IMPORTANT: No data = 'unknown', NOT 'green'! Must be honest.
    let status: AvailabilityStatus = "unknown";
    if (total === 0) {
      status = "unknown"; // No data - must be honest, don't assume healthy!
    } else {
      // Simple: >= 50% success = green, otherwise red
      status = availability >= 0.5 ? "green" : "red";
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      status,
      availability,
      requestCount: total,
      lastRequestAt: stats.lastRequestAt,
    };
  });
}
