## ADDED Requirements

### Requirement: CCH derives operator-facing outcomes for local client aborts
The system SHALL assign a derived client-abort outcome to each request row whose terminal state is a locally generated `499 CLIENT_ABORTED`. The derived outcome SHALL be independent from the stored transport status and SHALL be derived from CCH-local request facts plus same-session correlation. Supported outcomes SHALL include `session_continued`, `after_stream_start`, and `before_stream_start`. The system SHALL also mark whether the abort exceeded the configured long-running threshold.

#### Scenario: Same session continues shortly after a local abort
- **WHEN** a request ends as a locally generated `499 CLIENT_ABORTED` and the same `session_id` produces a later request inside the configured continuation window
- **THEN** the original row SHALL keep `status_code=499` and `error_message=CLIENT_ABORTED`
- **THEN** the derived client-abort outcome SHALL be `session_continued`

#### Scenario: Stream had already started before the local abort
- **WHEN** a request ends as a locally generated `499 CLIENT_ABORTED`, no same-session continuation is found inside the continuation window, and CCH has evidence that the stream had started
- **THEN** the derived client-abort outcome SHALL be `after_stream_start`

#### Scenario: Stream never started before the local abort
- **WHEN** a request ends as a locally generated `499 CLIENT_ABORTED`, no same-session continuation is found inside the continuation window, and CCH has no evidence of first byte, output, or cost
- **THEN** the derived client-abort outcome SHALL be `before_stream_start`

#### Scenario: Upstream 499 is not treated as a local client abort
- **WHEN** a request row has `status_code=499` but the termination did not originate from a local `CLIENT_ABORTED` classification
- **THEN** the system SHALL NOT assign a derived local client-abort outcome to that row

#### Scenario: Long-running local abort is flagged
- **WHEN** a locally generated `499 CLIENT_ABORTED` exceeds the configured long-running threshold before termination
- **THEN** the derived client-abort metadata SHALL mark the row as long-running

### Requirement: Traffic logs expose client-abort outcomes without hiding transport status
The traffic logs experience SHALL show the derived client-abort outcome for local `499 CLIENT_ABORTED` rows while preserving the original transport status code and error message.

#### Scenario: Log row shows a continuation outcome
- **WHEN** a local `499 CLIENT_ABORTED` row has derived outcome `session_continued`
- **THEN** the logs list SHALL continue to display the `499` status code
- **THEN** the row SHALL display an additional neutral client-abort outcome label that distinguishes it from generic provider failure rows

#### Scenario: Request details show supporting client-abort facts
- **WHEN** an operator opens request details for a local `499 CLIENT_ABORTED` row
- **THEN** the details view SHALL show the derived outcome
- **THEN** the details view SHALL show whether the stream had started, whether the abort was long-running, and whether the same session continued shortly after the abort

#### Scenario: Logs can be filtered by client-abort outcome
- **WHEN** an operator applies a client-abort outcome filter in traffic logs
- **THEN** only rows whose derived client-abort outcome matches the selected value SHALL be returned
- **THEN** non-local `499` rows SHALL remain outside that outcome filter unless they also satisfy another explicit status filter

### Requirement: Availability separates local client aborts from provider reliability
Provider availability calculations SHALL exclude locally generated client-abort rows from provider failure scoring and SHALL surface them through separate client-abort counters grouped by derived outcome.

#### Scenario: Session continuation does not reduce provider availability
- **WHEN** a request is classified as local `CLIENT_ABORTED` with derived outcome `session_continued`
- **THEN** provider green/red counts and provider availability score SHALL NOT treat that row as a provider failure
- **THEN** the availability result SHALL increment a separate client-abort continuation counter

#### Scenario: Early disconnect remains visible without being blamed on the provider
- **WHEN** a request is classified as local `CLIENT_ABORTED` with derived outcome `before_stream_start` or `after_stream_start`
- **THEN** provider green/red counts and provider availability score SHALL NOT treat that row as a provider failure
- **THEN** the availability result SHALL increment a separate client-abort counter for the matching outcome

#### Scenario: Provider-side failures still count as failures
- **WHEN** a request ends with a non-local 4xx/5xx failure or a `STREAM_*` upstream termination
- **THEN** the availability calculation SHALL continue to count that request as a provider failure
