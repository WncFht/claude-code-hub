## Context

`CLIENT_ABORTED` is already modeled correctly in the proxy layer: CCH synthesizes a local `499` when the downstream client aborts the stream, and it keeps upstream half-stream failures in separate `STREAM_*` buckets. The problem is downstream of that classification. `message_request` stores only the transport-facing `status_code` and `error_message`, the traffic logs UI renders `499` as a generic failure, and `availability-service.ts` currently marks every `>=400` row as a provider failure.

Recent production evidence shows many local `499 CLIENT_ABORTED` rows are not provider reliability incidents. A large subset either produced output before ending or was followed by another request in the same session within seconds, which matches approval handoffs, rapid follow-up prompts, reconnect/resume behavior, or explicit stop-and-continue flows. We cannot fix those client behaviors inside CCH, but we can make CCH explain them correctly.

Constraints:

- Preserve the existing transport audit trail: local client aborts must remain `status_code=499` plus `error_message=CLIENT_ABORTED`.
- Do not require changes in VS Code or CodexMonitor clients.
- Work with the existing async `message_request` write buffer and session sequencing model.
- Keep availability queries cheap enough for the current dashboard workload.

## Goals / Non-Goals

**Goals:**

- Give every local `CLIENT_ABORTED` row a stable, queryable derived outcome that operators can understand.
- Distinguish benign session continuation from suspicious disconnects without changing proxy protocol behavior.
- Make traffic logs and availability use the same derived semantics instead of reinterpreting `499` differently per surface.
- Keep the classification logic deterministic and testable for both real-time writes and historical backfill.

**Non-Goals:**

- Changing how clients cancel, resume, or reconnect streams.
- Hiding or rewriting local `499` rows into `200`.
- Building a full session replay/debugger for all client lifecycle issues.
- Reclassifying upstream `499` or `STREAM_*` failures as client aborts.

## Decisions

### 1. Persist derived client-abort observability fields on `message_request`

Add additive `message_request` columns for the derived client-abort view instead of recomputing it independently in each reader. The new fields should include:

- `client_abort_outcome`: nullable string enum with values `session_continued`, `after_stream_start`, `before_stream_start`
- `client_abort_long_running`: nullable boolean
- `client_abort_continued_by_request_id`: nullable integer reference to the next request that continued the session
- `client_abort_continued_at`: nullable timestamp of that next request

Rationale:

- Traffic logs need stable filtering and display.
- Availability needs cheap aggregation without expensive per-row ad hoc correlation.
- A stored outcome creates one contract for UI, exports, and future reporting.

Alternatives considered:

- Read-time enrichment only: rejected because logs filters and availability aggregation would each need separate correlation logic, and large-range availability reads would keep paying the classification cost.
- Materialized view only: rejected because the dashboard already reads `message_request` directly in multiple places, and a second storage surface would add operational complexity without removing the need for write-time semantics.

### 2. Use a two-stage classification lifecycle with idempotent continuation reconciliation

Classification happens in two phases:

1. On local `CLIENT_ABORTED` finalization, CCH writes a provisional outcome:
   - `after_stream_start` when the request has evidence that the stream started (`ttfb_ms` present, `output_tokens > 0`, or non-zero `cost_usd`)
   - `before_stream_start` otherwise
   - `client_abort_long_running=true` when `duration_ms` exceeds the configured threshold
2. A reconciliation helper upgrades that provisional outcome to `session_continued` when the same session produces a later request inside the continuation window.

The reconciliation helper must be callable from both sides of the race:

- after a local abort is finalized, in case the next request already exists
- after a new request row is created, in case the previous request already finalized as local `CLIENT_ABORTED`

The continuation check should use the session ordering that CCH already owns:

- locate the nearest adjacent request in the same session using `session_id` plus `request_sequence`
- compare the next request’s `created_at` against the previous request’s computed finish time (`created_at + duration_ms`) plus a continuation window

Recommended defaults:

- continuation window: `10_000ms`
- long-running threshold: `60_000ms`

Rationale:

- Session-local adjacency avoids blaming unrelated requests that merely share a user or time range.
- Dual-entry reconciliation handles the real race where the next request can be inserted before the previous row’s final `499` update is flushed.
- Using finish-time instead of start-time prevents long streams from being misclassified as “continued” only because their session spans overlap.

Alternatives considered:

- Pure time-based correlation across all requests: rejected because it is too noisy and ignores the session sequencing already present in CCH.
- Reconciliation only when the next request is created: rejected because many next requests appear before the prior row finishes writing its terminal state.

### 3. Keep transport status rendering, but add a secondary outcome surface in traffic logs

Traffic logs should continue to show the real `499` badge, but local client-abort rows should receive an additional neutral outcome badge and richer details in the request sheet. The UI should not replace the main status badge; it should layer operator context on top of it.

The logs API/action layer should expose the derived fields directly so the dashboard can:

- render a secondary badge in the table row
- show outcome, long-running flag, and continuation linkage in `ErrorDetailsDialog`
- support an optional `clientAbortOutcome` filter without affecting non-local `499` rows

Rationale:

- Operators still need the raw transport status for audit/debug parity.
- The secondary badge communicates “what kind of 499 this was” without pretending it was a success.

Alternatives considered:

- Replace `499` with a friendly label: rejected because it hides useful low-level truth.
- Keep the outcome only inside the detail sheet: rejected because the list view is where the current triage pain happens.

### 4. Treat local client aborts as a separate availability dimension, not provider failure

Availability should measure provider reliability, so locally generated `CLIENT_ABORTED` rows must stop contributing to provider red counts. Instead, availability summaries and bucket metrics should gain a separate client-abort counter structure, for example:

- `sessionContinued`
- `afterStreamStart`
- `beforeStreamStart`
- `longRunning`

This affects:

- `classifyRequestStatus` and the aggregation loop in `availability-service.ts`
- `ProviderAvailabilitySummary` and `TimeBucketMetrics`
- overview error-rate calculation in `availability-dashboard.tsx`
- provider lane/tooltips so client abort churn is still visible to operators

Rationale:

- Provider availability should not drop because a client panel reloads or a user quickly continues the same thread.
- Separating provider failures from client abort churn makes the current dashboard far more actionable.

Alternatives considered:

- Count only “suspicious” local aborts as provider failures: rejected because even suspicious local aborts are not provider-originated failures; they deserve visibility, but in a separate dimension.

### 5. Backfill recent local aborts after schema rollout

A one-off backfill should classify recent local `CLIENT_ABORTED` rows so the dashboard becomes useful immediately after deployment. The backfill can target a bounded recent window (for example, 7 days) and reuse the same continuation rules based on `session_id`, `request_sequence`, `created_at`, and `duration_ms`.

Rationale:

- Without backfill, operators would wait for enough fresh traffic before the new surfaces become trustworthy.
- The relevant volume is recent and bounded; we do not need to rewrite all historical rows.

Alternatives considered:

- No backfill: rejected because the immediate operational payoff would be weak.
- Full-history backfill: rejected because it adds cost without meaningful near-term value.

## Risks / Trade-offs

- [Continuation reconciliation misses a race] -> Make reconciliation idempotent and invoke it from both local-abort finalization and new-request creation; add targeted tests for both event orders.
- [Extra write amplification on busy sessions] -> Limit continuation patching to adjacent same-session requests and only for rows that are local `CLIENT_ABORTED`.
- [Sessionless aborts cannot be correlated] -> Leave them in provisional `after_stream_start` / `before_stream_start` outcomes and document that `session_continued` requires session metadata.
- [Availability UI gets noisier] -> Keep client-abort counters secondary to the main availability score; use tooltips, captions, or compact counter blocks instead of a brand-new complex chart in the first iteration.
- [Backfill and live logic diverge] -> Implement backfill through the same shared classifier helper/constants used by runtime reconciliation.

## Migration Plan

1. Add the new nullable `message_request` columns and any supporting partial index needed for `client_abort_outcome`.
2. Extend runtime write paths:
   - write provisional client-abort outcome when a local `CLIENT_ABORTED` request finalizes
   - run continuation reconciliation on both local-abort finalization and new-request creation
3. Expose the fields through usage-log repository/actions and update traffic logs UI.
4. Update availability aggregation and types to exclude local aborts from provider failure counts while surfacing separate counters.
5. Run a bounded backfill for recent local `CLIENT_ABORTED` rows.
6. Rollback plan: disable UI usage of the new fields first, then stop runtime writes; additive columns can remain in place if rollback is needed.

## Open Questions

- Should the first UI iteration add a dedicated availability overview chip for client-abort churn, or keep those counters in provider/tooltips only?
- Do we want the `clientAbortOutcome` filter exposed immediately in the logs toolbar, or ship the stored field first and wire the filter in the same release only if the UX stays lightweight?
