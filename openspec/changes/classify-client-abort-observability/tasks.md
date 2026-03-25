## 1. Data Model And Classification

- [x] 1.1 Add `message_request` schema, migration, and repository typings for persisted client-abort outcome fields and any supporting index.
- [x] 1.2 Implement a shared client-abort classification helper that computes provisional outcomes, long-running flags, and continuation-window constants from `message_request` facts.

## 2. Runtime Persistence And Reconciliation

- [x] 2.1 Update local `CLIENT_ABORTED` finalization paths to persist provisional client-abort outcome metadata without changing the stored `499` transport status.
- [x] 2.2 Add idempotent continuation reconciliation that can run from both local-abort finalization and new-request creation to upgrade matching rows to `session_continued`.
- [x] 2.3 Add a bounded backfill path for recent local `CLIENT_ABORTED` rows so existing dashboards gain the new classification soon after rollout.

## 3. Traffic Logs Surfacing

- [x] 3.1 Thread client-abort outcome fields through usage-log repository queries, action responses, and filter parsing.
- [x] 3.2 Update the logs table and error details sheet to show the derived client-abort outcome, long-running flag, and session continuation linkage alongside the raw `499` status.
- [x] 3.3 Add logs-toolbar filtering and i18n copy for client-abort outcomes without affecting non-local `499` rows.

## 4. Availability And Verification

- [x] 4.1 Update availability aggregation, types, and API responses so local client-abort outcomes no longer count as provider failures and are exposed via separate counters.
- [x] 4.2 Adjust availability dashboard presentation so provider error rate reflects provider-side failures while client-abort counters remain visible as secondary context.
- [x] 4.3 Add unit/integration coverage for classifier rules, reconciliation race ordering, logs filtering/rendering, availability aggregation, and any backfill helper.
- [x] 4.4 Document the new client-abort semantics, rollout/backfill behavior, and operator triage guidance for logs and availability pages.
