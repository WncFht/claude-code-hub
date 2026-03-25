import { beforeEach, describe, expect, test, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  selectResults: [] as unknown[],
  updatePayloads: [] as Record<string, unknown>[],
}));

function createSelectQuery(result: unknown) {
  const query: any = Promise.resolve(result);
  query.from = vi.fn(() => query);
  query.where = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.orderBy = vi.fn(() => query);
  return query;
}

function createUpdateQuery() {
  const query: any = Promise.resolve(undefined);
  query.set = vi.fn((payload: Record<string, unknown>) => {
    dbState.updatePayloads.push(payload);
    return query;
  });
  query.where = vi.fn(() => query);
  return query;
}

vi.mock("@/drizzle/db", () => ({
  db: {
    select: vi.fn(() => createSelectQuery(dbState.selectResults.shift() ?? [])),
    update: vi.fn(() => createUpdateQuery()),
  },
}));

const {
  backfillClientAbortObservabilityBatch,
  reconcileClientAbortContinuationFromLocalAbort,
  reconcileClientAbortContinuationFromNewRequest,
} = await import("@/repository/client-abort-observability");

describe("client abort observability repository helpers", () => {
  beforeEach(() => {
    dbState.selectResults = [];
    dbState.updatePayloads = [];
  });

  test("reconciles a new request with the previous local client abort", async () => {
    const currentCreatedAt = new Date("2026-03-25T12:00:05.000Z");

    dbState.selectResults.push([
      {
        id: 10,
        createdAt: new Date("2026-03-25T12:00:00.000Z"),
        durationMs: 2000,
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
      },
    ]);

    await expect(
      reconcileClientAbortContinuationFromNewRequest({
        currentRequestId: 11,
        currentCreatedAt,
        sessionId: "session-a",
        requestSequence: 2,
      })
    ).resolves.toBe(true);

    expect(dbState.updatePayloads).toHaveLength(1);
    expect(dbState.updatePayloads[0]).toMatchObject({
      clientAbortOutcome: "session_continued",
      clientAbortContinuedByRequestId: 11,
      clientAbortContinuedAt: currentCreatedAt,
    });
  });

  test("reconciles a local client abort with the next request when abort finalization runs second", async () => {
    const nextCreatedAt = new Date("2026-03-25T12:00:05.000Z");

    dbState.selectResults.push([
      {
        id: 12,
        createdAt: nextCreatedAt,
      },
    ]);

    await expect(
      reconcileClientAbortContinuationFromLocalAbort({
        abortedRequestId: 10,
        abortedCreatedAt: new Date("2026-03-25T12:00:00.000Z"),
        abortedDurationMs: 2000,
        sessionId: "session-a",
        requestSequence: 1,
      })
    ).resolves.toBe(true);

    expect(dbState.updatePayloads).toHaveLength(1);
    expect(dbState.updatePayloads[0]).toMatchObject({
      clientAbortOutcome: "session_continued",
      clientAbortContinuedByRequestId: 12,
      clientAbortContinuedAt: nextCreatedAt,
    });
  });

  test("backfill writes provisional metadata first and then upgrades to session_continued", async () => {
    const createdAt = new Date("2026-03-25T12:00:00.000Z");
    const continuedAt = new Date("2026-03-25T12:00:03.000Z");

    dbState.selectResults.push(
      [
        {
          id: 1,
          createdAt,
          durationMs: 1000,
          ttfbMs: 100,
          outputTokens: 24,
          costUsd: "0.0001",
          sessionId: "session-a",
          requestSequence: 7,
          statusCode: 499,
          errorMessage: "CLIENT_ABORTED",
        },
      ],
      [
        {
          id: 2,
          createdAt: continuedAt,
        },
      ]
    );

    await expect(
      backfillClientAbortObservabilityBatch({
        since: new Date("2026-03-24T00:00:00.000Z"),
      })
    ).resolves.toEqual({
      scanned: 1,
      updated: 1,
      reconciled: 1,
      lastProcessedId: 1,
    });

    expect(dbState.updatePayloads).toHaveLength(2);
    expect(dbState.updatePayloads[0]).toMatchObject({
      clientAbortOutcome: "after_stream_start",
      clientAbortLongRunning: false,
      clientAbortContinuedByRequestId: null,
      clientAbortContinuedAt: null,
    });
    expect(dbState.updatePayloads[1]).toMatchObject({
      clientAbortOutcome: "session_continued",
      clientAbortContinuedByRequestId: 2,
      clientAbortContinuedAt: continuedAt,
    });
  });
});
