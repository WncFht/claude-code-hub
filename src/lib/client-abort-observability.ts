export type ClientAbortOutcome = "session_continued" | "after_stream_start" | "before_stream_start";

export const CLIENT_ABORT_CONTINUATION_WINDOW_MS = 10_000;
export const CLIENT_ABORT_LONG_RUNNING_THRESHOLD_MS = 60_000;

type ClientAbortFacts = {
  statusCode?: number | null;
  errorMessage?: string | null;
  ttfbMs?: number | null;
  outputTokens?: number | null;
  costUsd?: string | number | null;
  durationMs?: number | null;
};

export type ClientAbortObservabilityPatch = {
  clientAbortOutcome: ClientAbortOutcome;
  clientAbortLongRunning: boolean;
  clientAbortContinuedByRequestId: number | null;
  clientAbortContinuedAt: Date | null;
};

function parseCostUsd(costUsd: string | number | null | undefined): number {
  if (typeof costUsd === "number") {
    return Number.isFinite(costUsd) ? costUsd : 0;
  }

  if (typeof costUsd !== "string") {
    return 0;
  }

  const trimmed = costUsd.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isLocalClientAbortStatus(
  statusCode: number | null | undefined,
  errorMessage: string | null | undefined
): boolean {
  return statusCode === 499 && errorMessage === "CLIENT_ABORTED";
}

export function hasClientAbortStreamStarted(facts: ClientAbortFacts): boolean {
  if (facts.ttfbMs != null) {
    return true;
  }

  if ((facts.outputTokens ?? 0) > 0) {
    return true;
  }

  return parseCostUsd(facts.costUsd) > 0;
}

export function isClientAbortLongRunning(
  durationMs: number | null | undefined,
  thresholdMs: number = CLIENT_ABORT_LONG_RUNNING_THRESHOLD_MS
): boolean {
  return durationMs != null && durationMs >= thresholdMs;
}

export function getProvisionalClientAbortOutcome(
  facts: ClientAbortFacts
): ClientAbortOutcome | null {
  if (!isLocalClientAbortStatus(facts.statusCode, facts.errorMessage)) {
    return null;
  }

  return hasClientAbortStreamStarted(facts) ? "after_stream_start" : "before_stream_start";
}

export function buildProvisionalClientAbortObservability(
  facts: ClientAbortFacts
): ClientAbortObservabilityPatch | null {
  const clientAbortOutcome = getProvisionalClientAbortOutcome(facts);
  if (!clientAbortOutcome) {
    return null;
  }

  return {
    clientAbortOutcome,
    clientAbortLongRunning: isClientAbortLongRunning(facts.durationMs),
    clientAbortContinuedByRequestId: null,
    clientAbortContinuedAt: null,
  };
}

export function computeClientAbortFinishTime(
  createdAt: Date | null | undefined,
  durationMs: number | null | undefined
): Date | null {
  if (!createdAt) {
    return null;
  }

  const safeDuration = durationMs != null && durationMs > 0 ? durationMs : 0;
  return new Date(createdAt.getTime() + safeDuration);
}

export function isClientAbortContinuationWithinWindow(params: {
  abortedCreatedAt: Date | null | undefined;
  abortedDurationMs: number | null | undefined;
  continuedCreatedAt: Date | null | undefined;
  continuationWindowMs?: number;
}): boolean {
  const {
    abortedCreatedAt,
    abortedDurationMs,
    continuedCreatedAt,
    continuationWindowMs = CLIENT_ABORT_CONTINUATION_WINDOW_MS,
  } = params;

  if (!abortedCreatedAt || !continuedCreatedAt) {
    return false;
  }

  if (continuedCreatedAt.getTime() < abortedCreatedAt.getTime()) {
    return false;
  }

  const finishTime = computeClientAbortFinishTime(abortedCreatedAt, abortedDurationMs);
  if (!finishTime) {
    return false;
  }

  return continuedCreatedAt.getTime() - finishTime.getTime() <= continuationWindowMs;
}

export function getClientAbortOutcomeLabelKey(
  outcome: ClientAbortOutcome
): `logs.clientAbort.outcomes.${ClientAbortOutcome}` {
  return `logs.clientAbort.outcomes.${outcome}`;
}
