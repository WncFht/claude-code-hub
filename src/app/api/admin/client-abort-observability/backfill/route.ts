import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { backfillClientAbortObservabilityBatch } from "@/repository/client-abort-observability";

export const runtime = "nodejs";

const backfillRequestSchema = z.object({
  sinceHours: z.number().int().min(1).max(24 * 30).optional(),
  batchSize: z.number().int().min(1).max(1000).optional(),
  afterId: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      logger.warn({ action: "client_abort_backfill_unauthorized" });
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = backfillRequestSchema.parse(body);
    const sinceHours = validated.sinceHours ?? 24 * 7;
    const batchSize = validated.batchSize ?? 200;
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const result = await backfillClientAbortObservabilityBatch({
      since,
      afterId: validated.afterId,
      limit: batchSize,
    });

    logger.info({
      action: "client_abort_backfill_completed",
      user: session.user.name,
      sinceHours,
      batchSize,
      afterId: validated.afterId ?? null,
      scanned: result.scanned,
      updated: result.updated,
      reconciled: result.reconciled,
      lastProcessedId: result.lastProcessedId,
    });

    return Response.json({
      success: true,
      since: since.toISOString(),
      batchSize,
      scanned: result.scanned,
      updated: result.updated,
      reconciled: result.reconciled,
      nextAfterId: result.lastProcessedId,
      hasMore: result.scanned === batchSize,
    });
  } catch (error) {
    logger.error({
      action: "client_abort_backfill_error",
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "请求参数格式错误",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: "回填 client abort observability 失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
