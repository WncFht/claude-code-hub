import type { AvailabilityQueryResult } from "@/lib/availability";

export type TimeRangeOption = "15min" | "1h" | "6h" | "24h" | "7d";

export const TARGET_BUCKETS = 60;

export const TIME_RANGE_MAP: Record<TimeRangeOption, number> = {
  "15min": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export function calculateBucketSize(timeRangeMs: number): number {
  const bucketSizeMs = timeRangeMs / TARGET_BUCKETS;
  const bucketSizeMinutes = bucketSizeMs / (60 * 1000);
  return Math.max(0.25, Math.round(bucketSizeMinutes * 4) / 4);
}

export async function fetchAvailabilityData(
  timeRange: TimeRangeOption,
  signal?: AbortSignal
): Promise<AvailabilityQueryResult> {
  const now = new Date();
  const timeRangeMs = TIME_RANGE_MAP[timeRange];
  const startTime = new Date(now.getTime() - timeRangeMs);
  const bucketSizeMinutes = calculateBucketSize(timeRangeMs);
  const params = new URLSearchParams({
    startTime: startTime.toISOString(),
    endTime: now.toISOString(),
    bucketSizeMinutes: bucketSizeMinutes.toString(),
    maxBuckets: TARGET_BUCKETS.toString(),
  });

  const response = await fetch(`/api/availability?${params}`, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("FETCH_AVAILABILITY_FAILED");
  }

  return response.json() as Promise<AvailabilityQueryResult>;
}

export function getAvailabilityQueryOptions(timeRange: TimeRangeOption) {
  return {
    queryKey: ["availability", timeRange],
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetchAvailabilityData(timeRange, signal),
    staleTime: 5_000,
  } as const;
}
