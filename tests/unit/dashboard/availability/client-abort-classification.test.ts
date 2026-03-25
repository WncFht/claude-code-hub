import { describe, expect, test } from "vitest";
import { classifyRequestStatus } from "@/lib/availability";

describe("availability client-abort classification", () => {
  test("local client aborts with derived outcome do not count against provider availability", () => {
    expect(
      classifyRequestStatus({
        statusCode: 499,
        errorMessage: "CLIENT_ABORTED",
        clientAbortOutcome: "session_continued",
        clientAbortLongRunning: true,
      })
    ).toEqual({
      status: "unknown",
      isSuccess: false,
      isError: false,
      countsTowardAvailability: false,
      countsTowardClientAbort: true,
      clientAbortOutcome: "session_continued",
      clientAbortLongRunning: true,
    });
  });

  test("generic 499 rows without derived client-abort outcome still count as provider failures", () => {
    expect(
      classifyRequestStatus({
        statusCode: 499,
        errorMessage: "UPSTREAM_ABORTED",
        clientAbortOutcome: null,
        clientAbortLongRunning: null,
      })
    ).toEqual({
      status: "red",
      isSuccess: false,
      isError: true,
      countsTowardAvailability: true,
      countsTowardClientAbort: false,
      clientAbortLongRunning: false,
    });
  });
});
