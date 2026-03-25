import "server-only";

import { and, asc, eq, gt, gte, isNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { messageRequest } from "@/drizzle/schema";
import {
  buildProvisionalClientAbortObservability,
  type ClientAbortObservabilityPatch,
  isClientAbortContinuationWithinWindow,
  isLocalClientAbortStatus,
} from "@/lib/client-abort-observability";

type ClientAbortObservabilityUpdate = Partial<ClientAbortObservabilityPatch>;

type BackfillCandidateRow = {
  id: number;
  createdAt: Date | null;
  durationMs: number | null;
  ttfbMs: number | null;
  outputTokens: number | null;
  costUsd: string | null;
  sessionId: string | null;
  requestSequence: number | null;
  statusCode: number | null;
  errorMessage: string | null;
};

export interface ClientAbortBackfillBatchResult {
  scanned: number;
  updated: number;
  reconciled: number;
  lastProcessedId: number | null;
}

function buildClientAbortObservabilityUpdate(
  patch: ClientAbortObservabilityUpdate
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (patch.clientAbortOutcome !== undefined) {
    update.clientAbortOutcome = patch.clientAbortOutcome;
  }
  if (patch.clientAbortLongRunning !== undefined) {
    update.clientAbortLongRunning = patch.clientAbortLongRunning;
  }
  if (patch.clientAbortContinuedByRequestId !== undefined) {
    update.clientAbortContinuedByRequestId = patch.clientAbortContinuedByRequestId;
  }
  if (patch.clientAbortContinuedAt !== undefined) {
    update.clientAbortContinuedAt = patch.clientAbortContinuedAt;
  }

  return update;
}

export async function updateMessageRequestClientAbortObservability(
  id: number,
  patch: ClientAbortObservabilityUpdate
): Promise<void> {
  const update = buildClientAbortObservabilityUpdate(patch);
  const updateKeys = Object.keys(update);
  if (updateKeys.length === 1 && updateKeys[0] === "updatedAt") {
    return;
  }

  await db
    .update(messageRequest)
    .set(update)
    .where(and(eq(messageRequest.id, id), isNull(messageRequest.deletedAt)));
}

export async function reconcileClientAbortContinuationFromNewRequest(params: {
  currentRequestId: number;
  currentCreatedAt: Date | null;
  sessionId: string | null | undefined;
  requestSequence: number | null | undefined;
}): Promise<boolean> {
  const { currentRequestId, currentCreatedAt, sessionId, requestSequence } = params;
  if (!sessionId || requestSequence == null || requestSequence <= 1 || !currentCreatedAt) {
    return false;
  }

  const [previousRequest] = await db
    .select({
      id: messageRequest.id,
      createdAt: messageRequest.createdAt,
      durationMs: messageRequest.durationMs,
      statusCode: messageRequest.statusCode,
      errorMessage: messageRequest.errorMessage,
    })
    .from(messageRequest)
    .where(
      and(
        eq(messageRequest.sessionId, sessionId),
        eq(messageRequest.requestSequence, requestSequence - 1),
        isNull(messageRequest.deletedAt)
      )
    )
    .limit(1);

  if (
    !previousRequest ||
    !isLocalClientAbortStatus(previousRequest.statusCode, previousRequest.errorMessage)
  ) {
    return false;
  }

  if (
    !isClientAbortContinuationWithinWindow({
      abortedCreatedAt: previousRequest.createdAt,
      abortedDurationMs: previousRequest.durationMs,
      continuedCreatedAt: currentCreatedAt,
    })
  ) {
    return false;
  }

  await updateMessageRequestClientAbortObservability(previousRequest.id, {
    clientAbortOutcome: "session_continued",
    clientAbortContinuedByRequestId: currentRequestId,
    clientAbortContinuedAt: currentCreatedAt,
  });

  return true;
}

export async function reconcileClientAbortContinuationFromLocalAbort(params: {
  abortedRequestId: number;
  abortedCreatedAt: Date | null;
  abortedDurationMs: number | null;
  sessionId: string | null | undefined;
  requestSequence: number | null | undefined;
}): Promise<boolean> {
  const { abortedRequestId, abortedCreatedAt, abortedDurationMs, sessionId, requestSequence } =
    params;

  if (!sessionId || requestSequence == null || !abortedCreatedAt) {
    return false;
  }

  const [nextRequest] = await db
    .select({
      id: messageRequest.id,
      createdAt: messageRequest.createdAt,
    })
    .from(messageRequest)
    .where(
      and(
        eq(messageRequest.sessionId, sessionId),
        eq(messageRequest.requestSequence, requestSequence + 1),
        isNull(messageRequest.deletedAt)
      )
    )
    .orderBy(asc(messageRequest.createdAt), asc(messageRequest.id))
    .limit(1);

  if (
    !nextRequest ||
    !isClientAbortContinuationWithinWindow({
      abortedCreatedAt,
      abortedDurationMs,
      continuedCreatedAt: nextRequest.createdAt,
    })
  ) {
    return false;
  }

  await updateMessageRequestClientAbortObservability(abortedRequestId, {
    clientAbortOutcome: "session_continued",
    clientAbortContinuedByRequestId: nextRequest.id,
    clientAbortContinuedAt: nextRequest.createdAt,
  });

  return true;
}

async function findLocalClientAbortBackfillCandidates(params: {
  since: Date;
  afterId?: number;
  limit: number;
}): Promise<BackfillCandidateRow[]> {
  const conditions = [
    isNull(messageRequest.deletedAt),
    gte(messageRequest.createdAt, params.since),
    eq(messageRequest.statusCode, 499),
    eq(messageRequest.errorMessage, "CLIENT_ABORTED"),
    isNull(messageRequest.clientAbortOutcome),
  ];

  if (params.afterId != null) {
    conditions.push(gt(messageRequest.id, params.afterId));
  }

  return db
    .select({
      id: messageRequest.id,
      createdAt: messageRequest.createdAt,
      durationMs: messageRequest.durationMs,
      ttfbMs: messageRequest.ttfbMs,
      outputTokens: messageRequest.outputTokens,
      costUsd: messageRequest.costUsd,
      sessionId: messageRequest.sessionId,
      requestSequence: messageRequest.requestSequence,
      statusCode: messageRequest.statusCode,
      errorMessage: messageRequest.errorMessage,
    })
    .from(messageRequest)
    .where(and(...conditions))
    .orderBy(asc(messageRequest.id))
    .limit(params.limit);
}

export async function backfillClientAbortObservabilityBatch(params: {
  since: Date;
  afterId?: number;
  limit?: number;
}): Promise<ClientAbortBackfillBatchResult> {
  const limit = params.limit ?? 200;
  const candidates = await findLocalClientAbortBackfillCandidates({
    since: params.since,
    afterId: params.afterId,
    limit,
  });

  let updated = 0;
  let reconciled = 0;

  for (const candidate of candidates) {
    if (!isLocalClientAbortStatus(candidate.statusCode, candidate.errorMessage)) {
      continue;
    }

    const provisional = buildProvisionalClientAbortObservability(candidate);
    if (!provisional) {
      continue;
    }

    await updateMessageRequestClientAbortObservability(candidate.id, provisional);
    updated += 1;

    if (
      await reconcileClientAbortContinuationFromLocalAbort({
        abortedRequestId: candidate.id,
        abortedCreatedAt: candidate.createdAt,
        abortedDurationMs: candidate.durationMs,
        sessionId: candidate.sessionId,
        requestSequence: candidate.requestSequence,
      })
    ) {
      reconciled += 1;
    }
  }

  return {
    scanned: candidates.length,
    updated,
    reconciled,
    lastProcessedId: candidates.length > 0 ? candidates[candidates.length - 1].id : null,
  };
}
