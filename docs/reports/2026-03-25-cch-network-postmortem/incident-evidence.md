# CCH Network Incident Evidence

Accessed on 2026-03-25. Unless noted otherwise, shell commands were executed on `archbox` in CST (`Asia/Shanghai`).

## E1. Bad `dns:` override preserved in runtime backup

Source file:

- `/home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml.bak-20260325-1912`

Command:

```bash
nl -ba /home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml.bak-20260325-1912 | sed -n '66,79p'
```

Output:

```text
    66	      SESSION_TTL: ${SESSION_TTL:-300}
    67	      TZ: Asia/Shanghai
    68	    ports:
    69	      - "${APP_PORT:-23000}:${APP_PORT:-23000}"
    70	    dns:
    71	      - 119.29.29.29
    72	      - 223.5.5.5
    73	    extra_hosts:
    74	      - "host.docker.internal:host-gateway"
    75	    restart: unless-stopped
    76	    networks:
    77	      - claude-code-hub-net-s6gz
    78	    healthcheck:
    79	      test: ["CMD-SHELL", "curl -f http://localhost:${APP_PORT:-23000}/api/actions/health || exit 1"]
```

Interpretation:

- The broken runtime compose explicitly overrode container DNS to `119.29.29.29` and `223.5.5.5`.
- This is the strongest preserved artifact for the main regression.

## E2. Current running `app` container comes from `docker-compose.archbox.yaml`, with no Docker-level `Dns` override

Command:

```bash
docker inspect claude-code-hub-app-s6gz --format '{{json .HostConfig.Dns}} {{json .HostConfig.ExtraHosts}} {{json .Config.Labels}}'
```

Output:

```text
null ["host.docker.internal:100.121.76.120"] {"com.docker.compose.config-hash":"8c7fff34a8c16240ec4bcd737ee492957fbb97d5e0a1e3dbe1d97edf587d0edc","com.docker.compose.container-number":"1","com.docker.compose.depends_on":"","com.docker.compose.image":"sha256:c4a6388c12970142b32d9d5015fe5a5c3c13d91a03d8d04871c4b8cfb41d7c95","com.docker.compose.image.builder":"classic","com.docker.compose.oneoff":"False","com.docker.compose.project":"claude-code-hub","com.docker.compose.project.config_files":"/home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml","com.docker.compose.project.working_dir":"/home/fanghaotian/Applications/claude-code-hub","com.docker.compose.replace":"claude-code-hub-app-s6gz","com.docker.compose.service":"app","com.docker.compose.version":"5.1.1","org.opencontainers.image.revision":"c293f70568e9c70bc87fad16345cbb5c52dc00e3","org.opencontainers.image.source":"https://github.com/ding113/claude-code-hub","org.opencontainers.image.version":"0.6.5"}
```

Interpretation:

- `HostConfig.Dns` is `null`, so the current live container is no longer carrying the bad DNS override.
- The running container was created from `/home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml`.

## E3. Current live health and container status

Commands:

```bash
docker compose -f /home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml ps
curl -sS http://127.0.0.1:23000/api/actions/health
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | sed -n '1,40p'
```

Output:

```text
NAME                         IMAGE                            COMMAND                   SERVICE    CREATED          STATUS                    PORTS
claude-code-hub-app-s6gz     claude-code-hub:local-a9b8775d   "docker-entrypoint.s…"   app        27 minutes ago   Up 27 minutes (healthy)   3000/tcp, 0.0.0.0:23000->23000/tcp, [::]:23000->23000/tcp
claude-code-hub-db-s6gz      postgres:18                      "docker-entrypoint.s…"   postgres   2 hours ago      Up 27 minutes (healthy)   127.0.0.1:35432->5432/tcp
claude-code-hub-redis-s6gz   redis:7-alpine                   "docker-entrypoint.s…"   redis      2 hours ago      Up 27 minutes (healthy)   6379/tcp
```

```json
{"status":"ok","timestamp":"2026-03-25T12:51:40.370Z","version":"1.0.0"}
```

```text
NAMES                         STATUS                    PORTS
claude-code-hub-app-s6gz      Up 26 minutes (healthy)   3000/tcp, 0.0.0.0:23000->23000/tcp, [::]:23000->23000/tcp
claude-code-hub-redis-s6gz    Up 27 minutes (healthy)   6379/tcp
claude-code-hub-db-s6gz       Up 27 minutes (healthy)   127.0.0.1:35432->5432/tcp
live-dashboard-app            Up 27 minutes             127.0.0.1:23110->3000/tcp
supabase_studio_check-cx      Up 27 minutes (healthy)   0.0.0.0:54323->3000/tcp, [::]:54323->3000/tcp
...
```

Interpretation:

- The live CCH stack is healthy and bound on `23000`.
- `live-dashboard-app` is a separate runtime and remains present for ingress-vs-egress comparison.

## E4. App logs show one proxied success, then a later direct RC success without `Using proxy`

Command:

```bash
docker logs --since 3h claude-code-hub-app-s6gz 2>&1 | sed -n '105,118p'
```

Output:

```text
{"level":"info","time":"2026-03-25T12:24:41.858Z","pid":1,"hostname":"f43fd5566207","sessionId":"019d24f4-3d69-7e24-9657-34d6bb37354d","providerId":1,"providerName":"RC","priority":0,"reason":"first_success","details":"首次成功，绑定到供应商 1 (priority=0)","attemptNumber":1,"totalProvidersAttempted":1,"msg":"[ResponseHandler] Session binding updated (stream finalized)"}
{"level":"info","time":"2026-03-25T12:24:41.859Z","pid":1,"hostname":"f43fd5566207","providerId":1,"providerName":"RC","attemptNumber":1,"totalProvidersAttempted":1,"statusCode":200,"msg":"[ResponseHandler] Streaming request finalized as success"}
{"level":"info","time":"2026-03-25T12:24:41.864Z","pid":1,"hostname":"f43fd5566207","sessionId":"codex_019d24f4-3d69-7e24-9657-34d6bb37354d","promptCacheKey":"019d24f4-3d69-7e24-9657-34d6bb37354d","providerId":1,"ttl":300,"msg":"SessionManager: Created Codex session from prompt_cache_key"}
{"level":"info","time":"2026-03-25T12:24:41.873Z","pid":1,"hostname":"f43fd5566207","messageId":28388,"usedModelForPricing":"gpt-5.4","resolvedPricingProviderKey":"openai","pricingResolutionSource":"official_fallback","costUsd":"0.0063175","costMultiplier":1,"usage":{"input_tokens":2497,"output_tokens":5,"cache_read_input_tokens":0},"msg":"[CostCalculation] Cost calculated successfully"}
{"level":"info","time":"2026-03-25T12:29:18.439Z","pid":1,"hostname":"f43fd5566207","action":"string_to_array","originalType":"string","sessionId":null,"msg":"[ResponseInputRectifier] Input normalized"}
{"level":"info","time":"2026-03-25T12:29:18.455Z","pid":1,"hostname":"f43fd5566207","requestedModel":"gpt-5.4","totalProviders":11,"enabledCount":3,"excludedIds":[],"userGroup":"default","afterGroupFilter":["Hiyo-qq","Hiyo-1","RC"],"afterHealthFilter":3,"filteredOut":[],"topPriorityLevel":0,"topPriorityCandidates":[{"id":1,"name":"RC","weight":5,"costMultiplier":1,"probability":1}],"selected":{"name":"RC","id":1,"type":"codex","priority":0,"weight":5,"cost":1,"circuitState":"closed"},"msg":"ProviderSelector: Selection decision"}
{"level":"info","time":"2026-03-25T12:29:18.473Z","pid":1,"hostname":"f43fd5566207","providerId":1,"providerName":"RC","totalProvidersAttempted":1,"maxRetryAttempts":2,"endpointCount":1,"endpointSelectionCriteria":"latency_ascending","selectedEndpoints":[{"index":0,"endpointId":1,"baseUrl":"https://right.codes/codex/"}],"msg":"ProxyForwarder: Trying provider"}
{"level":"info","time":"2026-03-25T12:29:19.428Z","pid":1,"hostname":"f43fd5566207","providerId":1,"providerName":"RC","attemptNumber":1,"totalProvidersAttempted":1,"statusCode":200,"msg":"ProxyForwarder: Streaming response received, deferring finalization"}
{"level":"info","time":"2026-03-25T12:29:19.964Z","pid":1,"hostname":"f43fd5566207","providerId":1,"providerName":"RC","attemptNumber":1,"totalProvidersAttempted":1,"statusCode":200,"msg":"[ResponseHandler] Streaming request finalized as success"}
{"level":"info","time":"2026-03-25T12:29:19.969Z","pid":1,"hostname":"f43fd5566207","messageId":28389,"usedModelForPricing":"gpt-5.4","resolvedPricingProviderKey":"openai","pricingResolutionSource":"official_fallback","costUsd":"0.0063175","costMultiplier":1,"usage":{"input_tokens":2497,"output_tokens":5,"cache_read_input_tokens":0},"msg":"[CostCalculation] Cost calculated successfully"}
```

Related grep:

```bash
docker logs --since 3h claude-code-hub-app-s6gz 2>&1 | rg -n "EAI_AGAIN|Using proxy|ProxyForwarder: Trying provider|statusCode\":200" -S
```

Output excerpt:

```text
99:{"level":"info","time":"2026-03-25T12:24:39.562Z",...,"msg":"ProxyForwarder: Trying provider"}
101:{"level":"info","time":"2026-03-25T12:24:39.566Z",...,"proxyUrl":"http://host.docker.internal:7897/","msg":"ProxyForwarder: Using proxy"}
111:{"level":"info","time":"2026-03-25T12:29:18.473Z",...,"msg":"ProxyForwarder: Trying provider"}
```

Interpretation:

- At `2026-03-25T12:24:39Z` the request still used proxy.
- At `2026-03-25T12:29:18Z` the later RC request succeeded with no `Using proxy` line between `Trying provider` and the `200` completion logs.
- The selected provider remained `RC`; the failure was not a provider selection bug.

## E5. Current connectivity split: `right.codes` is healthy; `codex.hiyo.top` currently fails TLS on both host and container

Commands:

```bash
curl -I -m 10 https://right.codes/
curl -I -m 10 https://codex.hiyo.top/ || true
docker exec claude-code-hub-app-s6gz sh -lc 'getent hosts right.codes && curl -I -m 10 --http1.1 https://right.codes/ || true'
docker exec claude-code-hub-app-s6gz sh -lc 'getent hosts codex.hiyo.top && curl -I -m 10 https://codex.hiyo.top/ || true'
```

Output excerpts:

```text
HTTP/2 200
date: Wed, 25 Mar 2026 12:52:09 GMT
server: cloudflare
```

```text
curl: (35) TLS connect error: error:0A000126:SSL routines::unexpected eof while reading
```

```text
104.21.91.201   www.xxsxx.fun right.codes
172.67.179.54   www.xxsxx.fun right.codes
HTTP/1.1 200 OK
Date: Wed, 25 Mar 2026 12:52:10 GMT
Server: cloudflare
```

```text
104.21.56.180   codex.hiyo.top
172.67.155.4    codex.hiyo.top
curl: (35) TLS connect error: error:0A000126:SSL routines::unexpected eof while reading
```

Interpretation:

- `right.codes` currently works from both host and the live CCH container.
- `codex.hiyo.top` currently fails with the same TLS EOF symptom on both host and container, so this specific residual is not explained by container egress or Docker DNS.
- Therefore, the main incident root cause and the present Hiyo endpoint symptom are not the same problem.

## E6. Current runtime compose files no longer contain the bad DNS override

Command:

```bash
rg -n "^\s*dns:|119\.29\.29\.29|223\.5\.5\.5" -n /home/fanghaotian/Applications/claude-code-hub/docker-compose*.yaml
```

Output:

```text
(no matches)
```

Interpretation:

- After cleanup, both runtime compose files under `/home/fanghaotian/Applications/claude-code-hub/` no longer contain the known-bad hardcoded DNS block.

## E7. Deploy script hardening and validation

Commands:

```bash
bash -n scripts/deploy.sh
bash scripts/deploy.sh --help | sed -n '1,40p'
npm exec -- vitest run tests/unit/scripts/deploy.test.ts
```

Output excerpts:

```text
Claude Code Hub - One-Click Deployment Script v1.2.0

Options:
  --compose-file <path>  Existing compose file used by --restart/--probe-only
  --env-file <path>      Existing env file used by --restart/--probe-only
  --app-service <name>   App service name for probes (default: app)
  --restart              Restart an existing deployment and run probes
  --probe-only           Only run deployment probes; do not change containers
```

```text
✓ tests/unit/scripts/deploy.test.ts > deploy.sh runtime modes > probe-only uses custom compose and env files for runtime probes
✓ tests/unit/scripts/deploy.test.ts > deploy.sh runtime modes > restart falls back to up -d when docker compose restart fails
```

Additional note:

- `pwsh` is not installed on this Linux workstation, so `scripts/deploy.ps1` was updated and manually reviewed but not locally executed.

## E8. Evidence boundary for the secondary Docker NAT issue

Observed during live repair:

- Docker NAT / `DOCKER` chain state was inconsistent, and restarting the daemon was part of recovery.

Evidence quality note:

- This report does **not** include a preserved primary artifact for that sub-issue comparable to `E1`.
- Treat the NAT-chain item as an operator observation that explains why one restart attempt escalated, not as the best-supported root cause for the original RC/Hiyo direct-connect regression.
