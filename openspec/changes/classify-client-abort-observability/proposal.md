## Why

`499 CLIENT_ABORTED` is currently accurate at the transport layer, but CCH still treats every local client abort as a generic red failure in traffic logs and provider availability. Recent production evidence shows many of these rows are normal stream lifecycle transitions such as approval handoffs, rapid follow-up requests, or client-side reconnect/resume behavior, so operators cannot quickly separate benign churn from real experience regressions.

## What Changes

- Add a CCH-side client-abort observability layer that derives higher-level abort outcomes for local `499 CLIENT_ABORTED` rows instead of leaving them as a single undifferentiated bucket.
- Correlate each local client abort with request facts already known to CCH, including whether output was produced, whether cost was incurred, request duration, and whether the same session continued shortly after the abort.
- Expose the derived abort outcome in traffic logs, filters, and request details so operators can distinguish benign session continuation from suspicious disconnects.
- Update availability aggregation to treat benign local client-abort outcomes differently from provider failures, while still counting suspicious aborts in reliability views.
- Add tests and operator-facing docs for the new classification and presentation rules.

## Capabilities

### New Capabilities
- `client-abort-observability`: classify local `CLIENT_ABORTED` rows into operator-meaningful outcomes and surface them consistently across logs and availability views.

### Modified Capabilities

## Impact

- Affected code: `src/app/v1/_lib/proxy/response-handler.ts`, `src/repository/usage-logs.ts`, `src/actions/usage-logs.ts`, `src/lib/availability/availability-service.ts`, dashboard logs components, and related tests/docs.
- Affected data flow: `message_request`-backed log reads and availability aggregation may need derived fields or correlated follow-up lookups for local client-abort rows.
- Operator impact: traffic logs, request detail sheets, and availability signals become more actionable without changing upstream/client protocol behavior.
