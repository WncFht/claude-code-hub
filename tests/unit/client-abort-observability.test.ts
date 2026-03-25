import { describe, expect, test } from "vitest";
import {
  CLIENT_ABORT_LONG_RUNNING_THRESHOLD_MS,
  buildProvisionalClientAbortObservability,
  getProvisionalClientAbortOutcome,
  hasClientAbortStreamStarted,
  isClientAbortContinuationWithinWindow,
  isClientAbortLongRunning,
} from "@/lib/client-abort-observability";

describe("client abort observability helpers", () => {
  test("classifies local aborts after stream start when output already exists", () => {
    expect(
      getProvisionalClientAbortOutcome({
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
        outputTokens: 32,
      })
    ).toBe("after_stream_start");

    expect(
      buildProvisionalClientAbortObservability({
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
        outputTokens: 32,
        durationMs: 1200,
      })
    ).toMatchObject({
      clientAbortOutcome: "after_stream_start",
      clientAbortLongRunning: false,
      clientAbortContinuedByRequestId: null,
      clientAbortContinuedAt: null,
    });
  });

  test("classifies local aborts before stream start when no output facts exist", () => {
    expect(
      getProvisionalClientAbortOutcome({
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
        outputTokens: 0,
        ttfbMs: null,
        costUsd: null,
      })
    ).toBe("before_stream_start");
  });

  test("does not classify non-local 499 rows", () => {
    expect(
      buildProvisionalClientAbortObservability({
        statusCode: 499,
        errorMessage: "UPSTREAM_499",
        outputTokens: 32,
      })
    ).toBeNull();
  });

  test("treats ttfb or cost as proof that the stream started", () => {
    expect(hasClientAbortStreamStarted({ ttfbMs: 1 })).toBe(true);
    expect(hasClientAbortStreamStarted({ costUsd: "0.000001" })).toBe(true);
    expect(hasClientAbortStreamStarted({ ttfbMs: null, outputTokens: 0, costUsd: 0 })).toBe(false);
  });

  test("marks long-running client aborts using the shared threshold", () => {
    expect(isClientAbortLongRunning(CLIENT_ABORT_LONG_RUNNING_THRESHOLD_MS - 1)).toBe(false);
    expect(isClientAbortLongRunning(CLIENT_ABORT_LONG_RUNNING_THRESHOLD_MS)).toBe(true);
  });

  test("uses request finish time when deciding whether a later request continued the session", () => {
    const abortedCreatedAt = new Date("2026-03-25T12:00:00.000Z");

    expect(
      isClientAbortContinuationWithinWindow({
        abortedCreatedAt,
        abortedDurationMs: 4000,
        continuedCreatedAt: new Date("2026-03-25T12:00:12.000Z"),
      })
    ).toBe(true);

    expect(
      isClientAbortContinuationWithinWindow({
        abortedCreatedAt,
        abortedDurationMs: 4000,
        continuedCreatedAt: new Date("2026-03-25T12:00:14.001Z"),
      })
    ).toBe(false);
  });
});
