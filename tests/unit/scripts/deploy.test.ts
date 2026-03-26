import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");
const scriptPath = join(repoRoot, "scripts", "deploy.sh");
const ansiEscapePattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const tempDirs: string[] = [];

function makeTempDir(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function stripAnsi(value: string) {
  return value.replace(ansiEscapePattern, "");
}

function writeExecutable(path: string, content: string) {
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}

function createFakeBin(logPath: string) {
  const binDir = makeTempDir("deploy-script-bin-");
  const dockerPath = join(binDir, "docker");
  const curlPath = join(binDir, "curl");

  writeExecutable(
    dockerPath,
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "${logPath}"

service_for_id() {
  case "$1" in
    postgres-id) echo "postgres" ;;
    redis-id) echo "redis" ;;
    app-id) echo "app" ;;
    *) echo "unknown" ;;
  esac
}

if [[ "$#" -eq 0 ]]; then
  exit 1
fi

case "$1" in
  --version)
    echo "Docker version 27.0.0, build test"
    exit 0
    ;;
  compose)
    shift
    subcommand=""
    while [[ "$#" -gt 0 ]]; do
      case "$1" in
        -f|--env-file)
          shift 2
          ;;
        version|config|ps|pull|up|restart|logs)
          subcommand="$1"
          shift
          break
          ;;
        *)
          shift
          ;;
      esac
    done

    case "$subcommand" in
      version)
        echo "Docker Compose version v2.30.0"
        ;;
      config)
        if [[ "\${1:-}" == "--services" ]]; then
          printf 'postgres\\nredis\\napp\\n'
        fi
        ;;
      ps)
        if [[ "\${1:-}" == "-q" ]]; then
          case "\${2:-}" in
            postgres) echo "postgres-id" ;;
            redis) echo "redis-id" ;;
            app) echo "app-id" ;;
          esac
        else
          printf 'NAME STATUS PORTS\\nclaude-code-hub-app-test running 0.0.0.0:24567->24567/tcp\\n'
        fi
        ;;
      pull)
        echo "pulled"
        ;;
      up)
        echo "started"
        ;;
      restart)
        if [[ "\${FAKE_DOCKER_RESTART_FAIL:-0}" == "1" ]]; then
          echo "restart failed" >&2
          exit 1
        fi
        echo "restarted"
        ;;
      logs)
        echo "app log line"
        ;;
      *)
        echo "unsupported docker compose subcommand: $subcommand" >&2
        exit 1
        ;;
    esac
    exit 0
    ;;
  inspect)
    format="\${2:-}"
    container_id="\${3:-}"
    service_name="$(service_for_id "$container_id")"
    case "$format" in
      *".Name"*)
        echo "/claude-code-hub-\${service_name}-test"
        ;;
      *".State.Status"*)
        echo "running"
        ;;
      *".State.Health"*)
        echo "healthy"
        ;;
      *)
        echo "unsupported inspect format: $format" >&2
        exit 1
        ;;
    esac
    ;;
  port)
    if [[ "\${2:-}" == "app-id" ]]; then
      echo "24567/tcp -> 0.0.0.0:24567"
    fi
    ;;
  exec)
    if [[ "\${2:-}" == "app-id" ]]; then
      if [[ "\${*: -1}" == *"curl -sS"* ]]; then
        echo '{"status":"ok"}'
      fi
      exit 0
    fi
    exit 1
    ;;
  *)
    echo "unsupported docker command: $1" >&2
    exit 1
    ;;
esac
`
  );

  writeExecutable(
    curlPath,
    `#!/usr/bin/env bash
set -euo pipefail

output_file=""
write_format=""
url=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -o)
      output_file="$2"
      shift 2
      ;;
    -w)
      write_format="$2"
      shift 2
      ;;
    -m|-X|-H)
      shift 2
      ;;
    -f|-s|-S|-sS|-fsS)
      shift
      ;;
    http://*|https://*)
      url="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

body='{"status":"ok"}'

if [[ -n "$output_file" ]]; then
  printf '%s' "$body" > "$output_file"
fi

if [[ "$write_format" == "%{http_code}" ]]; then
  printf '200'
else
  printf '%s' "$body"
fi

exit 0
`
  );

  return binDir;
}

function createRuntime() {
  const runtimeDir = makeTempDir("deploy-script-runtime-");
  mkdirSync(join(runtimeDir, "data"), { recursive: true });

  const composeFile = join(runtimeDir, "custom-compose.yaml");
  const envFile = join(runtimeDir, "custom.env");

  writeFileSync(composeFile, "services:\n  app:\n    image: test\n");
  writeFileSync(envFile, "APP_PORT=24567\n");

  return { runtimeDir, composeFile, envFile };
}

function runScript(args: string[], extraEnv: Record<string, string>) {
  return execFileSync("bash", [scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: "utf8",
    stdio: "pipe",
  });
}

describe("deploy.sh runtime modes", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { force: true, recursive: true });
      }
    }
  });

  test("probe-only uses custom compose and env files for runtime probes", () => {
    const { runtimeDir, composeFile, envFile } = createRuntime();
    const dockerLog = join(makeTempDir("deploy-script-log-"), "docker.log");
    const fakeBin = createFakeBin(dockerLog);

    const output = runScript(
      [
        "--probe-only",
        "-d",
        runtimeDir,
        "--compose-file",
        composeFile,
        "--env-file",
        envFile,
        "-y",
      ],
      {
        PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
      }
    );

    const cleanOutput = stripAnsi(output);
    const logOutput = stripAnsi(readFileSync(dockerLog, "utf8"));

    expect(cleanOutput).toContain("=== PROBE MODE ===");
    expect(cleanOutput).toContain("Runtime probe summary");
    expect(cleanOutput).toContain(
      "Host health probe: http://127.0.0.1:24567/api/actions/health -> 200"
    );
    expect(cleanOutput).toContain("Container health probe: claude-code-hub-app-test -> ok");
    expect(logOutput).toContain(
      `compose -f ${composeFile} --env-file ${envFile} config --services`
    );
    expect(logOutput).toContain(`compose -f ${composeFile} --env-file ${envFile} ps -q app`);
  });

  test("restart falls back to up -d when docker compose restart fails", () => {
    const { runtimeDir, composeFile, envFile } = createRuntime();
    const dockerLog = join(makeTempDir("deploy-script-log-"), "docker.log");
    const fakeBin = createFakeBin(dockerLog);

    const output = runScript(
      ["--restart", "-d", runtimeDir, "--compose-file", composeFile, "--env-file", envFile, "-y"],
      {
        PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
        FAKE_DOCKER_RESTART_FAIL: "1",
      }
    );

    const cleanOutput = stripAnsi(output);
    const logOutput = readFileSync(dockerLog, "utf8");

    expect(cleanOutput).toContain("=== RESTART MODE ===");
    expect(cleanOutput).toContain(
      "docker compose restart failed; falling back to docker compose up -d"
    );
    expect(cleanOutput).toContain("Runtime probes passed");
    expect(logOutput).toContain(`compose -f ${composeFile} --env-file ${envFile} restart`);
    expect(logOutput).toContain(`compose -f ${composeFile} --env-file ${envFile} up -d`);
  });
});
