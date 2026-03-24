import { describe, expect, it } from "vitest";
import {
  ErrorCategory,
  ProxyError,
  categorizeErrorAsync,
  diagnoseAbortError,
  isClientAbortError,
} from "@/app/v1/_lib/proxy/errors";

describe("diagnoseAbortError and isClientAbortError", () => {
  it("treats local ProxyError(499) as client abort", () => {
    const error = new ProxyError("Request aborted by client", 499, undefined, true);

    expect(diagnoseAbortError(error).code).toBe("client_abort");
    expect(isClientAbortError(error)).toBe(true);
  });

  it("does not treat upstream 499 as client abort", () => {
    const error = new ProxyError("Provider returned 499", 499);

    expect(diagnoseAbortError(error).code).toBe("unknown_abort");
    expect(isClientAbortError(error)).toBe(false);
  });

  it("treats ResponseAborted without local abort context as upstream abort", () => {
    const error = new Error("Response was aborted");
    error.name = "ResponseAborted";

    expect(diagnoseAbortError(error).code).toBe("upstream_abort");
    expect(isClientAbortError(error)).toBe(false);
  });

  it("treats AbortError without local context as unknown abort", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";

    expect(diagnoseAbortError(error).code).toBe("unknown_abort");
    expect(isClientAbortError(error)).toBe(false);
  });

  it("treats AbortError with client abort context as client abort", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";

    expect(diagnoseAbortError(error, { clientAborted: true }).code).toBe("client_abort");
    expect(isClientAbortError(error, { clientAborted: true })).toBe(true);
  });

  it("treats response-controller abort as response timeout", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";

    expect(diagnoseAbortError(error, { responseControllerAborted: true }).code).toBe(
      "response_timeout"
    );
  });

  it("treats streaming_idle abort reason as idle timeout", () => {
    const error = new Error("streaming_idle");

    expect(
      diagnoseAbortError(error, {
        responseControllerAborted: true,
        responseControllerReason: new Error("streaming_idle"),
      }).code
    ).toBe("stream_idle_timeout");
  });
});

describe("categorizeErrorAsync", () => {
  it("categorizes local 499 as CLIENT_ABORT", async () => {
    const error = new ProxyError("Request aborted by client", 499, undefined, true);

    expect(await categorizeErrorAsync(error)).toBe(ErrorCategory.CLIENT_ABORT);
  });

  it("categorizes upstream 499 as PROVIDER_ERROR", async () => {
    const error = new ProxyError("Provider returned 499", 499);

    expect(await categorizeErrorAsync(error)).toBe(ErrorCategory.PROVIDER_ERROR);
  });

  it("categorizes ResponseAborted as PROVIDER_ERROR", async () => {
    const error = new Error("Response was aborted");
    error.name = "ResponseAborted";

    expect(await categorizeErrorAsync(error)).toBe(ErrorCategory.PROVIDER_ERROR);
  });
});

describe("ProxyError.fromUpstreamResponse", () => {
  it("keeps upstream 499 non-local", async () => {
    const fakeResponse = new Response('{"error": "client closed"}', {
      status: 499,
      statusText: "Client Closed Request",
      headers: { "content-type": "application/json" },
    });

    const error = await ProxyError.fromUpstreamResponse(fakeResponse, {
      id: 1,
      name: "test-provider",
    });

    expect(error.statusCode).toBe(499);
    expect(error.isLocalAbort).toBe(false);
    expect(isClientAbortError(error)).toBe(false);
  });
});
