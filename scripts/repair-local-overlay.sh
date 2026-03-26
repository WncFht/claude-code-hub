#!/usr/bin/env bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

RUNTIME_DIR_DEFAULT="${HOME}/Applications/claude-code-hub"
RUNTIME_DIR="${RUNTIME_DIR_DEFAULT}"
COMPOSE_FILE=""
CONTEXT_DIR=""
ENV_FILE=""
APP_SERVICE="app"
HEALTH_URL=""
HEALTH_TIMEOUT_SECONDS=120
SKIP_BUILD=false
SKIP_SYNC=false
FORCE_RECREATE=true
START_PROXY_BRIDGE=true
DRY_RUN=false
BUILD_TOOL=""

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

show_help() {
  cat <<'EOF'
Repair a local-overlay Claude Code Hub deployment without touching provider state.

Usage:
  scripts/repair-local-overlay.sh [options]

Options:
  --runtime-dir <path>        Runtime directory with compose/.env files.
                              Default: ~/Applications/claude-code-hub
  --compose-file <path>       Runtime compose file to use.
                              Default: auto-detect docker-compose.archbox.yaml,
                              then docker-compose.yaml inside runtime dir.
  --context-dir <path>        Runtime local build context directory.
                              Default: <runtime-dir>/local-build-context
  --env-file <path>           Runtime env file to read APP_PORT from.
                              Default: <runtime-dir>/.env
  --app-service <name>        Compose service to rebuild. Default: app
  --health-url <url>          Override health endpoint URL.
                              Default: http://127.0.0.1:${APP_PORT:-23000}/api/actions/health
  --health-timeout <seconds>  Health polling timeout. Default: 120
  --build-tool <bun|pnpm|npm>
                              Override the package runner used for build.
                              Default: auto-detect bun, then pnpm, then npm.
  --skip-build                Skip 'bun run build'
  --skip-sync                 Skip rsync into local-build-context
  --no-force-recreate         Drop '--force-recreate' for app rebuild
  --no-proxy-bridge           Do not try to start docker-loopback-proxy-7897.socket
  --dry-run                   Print actions without changing anything
  -h, --help                  Show this help

Examples:
  scripts/repair-local-overlay.sh
  scripts/repair-local-overlay.sh \
    --runtime-dir /home/fanghaotian/Applications/claude-code-hub \
    --compose-file /home/fanghaotian/Applications/claude-code-hub/docker-compose.archbox.yaml
  scripts/repair-local-overlay.sh --build-tool pnpm
  scripts/repair-local-overlay.sh --skip-build --dry-run
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --runtime-dir)
        RUNTIME_DIR="$2"
        shift 2
        ;;
      --compose-file)
        COMPOSE_FILE="$2"
        shift 2
        ;;
      --context-dir)
        CONTEXT_DIR="$2"
        shift 2
        ;;
      --env-file)
        ENV_FILE="$2"
        shift 2
        ;;
      --app-service)
        APP_SERVICE="$2"
        shift 2
        ;;
      --health-url)
        HEALTH_URL="$2"
        shift 2
        ;;
      --health-timeout)
        HEALTH_TIMEOUT_SECONDS="$2"
        shift 2
        ;;
      --build-tool)
        BUILD_TOOL="$2"
        shift 2
        ;;
      --skip-build)
        SKIP_BUILD=true
        shift
        ;;
      --skip-sync)
        SKIP_SYNC=true
        shift
        ;;
      --no-force-recreate)
        FORCE_RECREATE=false
        shift
        ;;
      --no-proxy-bridge)
        START_PROXY_BRIDGE=false
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        log_error "Unknown argument: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    log_error "Missing required command: $command_name"
    exit 1
  fi
}

run_cmd() {
  if [[ "${DRY_RUN}" == true ]]; then
    local rendered=""
    printf -v rendered '%q ' "$@"
    echo "[DRY-RUN] ${rendered% }"
    return 0
  fi
  "$@"
}

detect_compose_file() {
  if [[ -n "${COMPOSE_FILE}" ]]; then
    return
  fi

  if [[ -f "${RUNTIME_DIR}/docker-compose.archbox.yaml" ]]; then
    COMPOSE_FILE="${RUNTIME_DIR}/docker-compose.archbox.yaml"
    return
  fi

  if [[ -f "${RUNTIME_DIR}/docker-compose.yaml" ]]; then
    COMPOSE_FILE="${RUNTIME_DIR}/docker-compose.yaml"
    return
  fi

  log_error "Could not find a runtime compose file under ${RUNTIME_DIR}"
  exit 1
}

detect_paths() {
  if [[ -z "${CONTEXT_DIR}" ]]; then
    CONTEXT_DIR="${RUNTIME_DIR}/local-build-context"
  fi

  if [[ -z "${ENV_FILE}" ]]; then
    ENV_FILE="${RUNTIME_DIR}/.env"
  fi
}

validate_inputs() {
  require_command docker
  require_command curl

  if [[ "${SKIP_SYNC}" != true ]]; then
    require_command rsync
  fi

  if ! docker compose version >/dev/null 2>&1; then
    log_error "docker compose is required"
    exit 1
  fi

  if [[ ! -d "${REPO_ROOT}" ]]; then
    log_error "Repo root does not exist: ${REPO_ROOT}"
    exit 1
  fi

  if [[ ! -d "${RUNTIME_DIR}" ]]; then
    log_error "Runtime dir does not exist: ${RUNTIME_DIR}"
    exit 1
  fi

  if [[ ! -f "${COMPOSE_FILE}" ]]; then
    log_error "Compose file does not exist: ${COMPOSE_FILE}"
    exit 1
  fi

  if [[ ! -f "${ENV_FILE}" ]]; then
    log_warning "Env file not found at ${ENV_FILE}; health URL will use the default port"
  fi

  if ! [[ "${HEALTH_TIMEOUT_SECONDS}" =~ ^[0-9]+$ ]] || [[ "${HEALTH_TIMEOUT_SECONDS}" -lt 5 ]]; then
    log_error "Invalid --health-timeout: ${HEALTH_TIMEOUT_SECONDS}"
    exit 1
  fi

  if [[ -n "${BUILD_TOOL}" ]]; then
    case "${BUILD_TOOL}" in
      bun|pnpm|npm)
        ;;
      *)
        log_error "Invalid --build-tool: ${BUILD_TOOL}"
        exit 1
        ;;
    esac
  fi
}

read_env_value() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 1
  fi

  local value
  value="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 | cut -d'=' -f2- || true)"
  if [[ -z "${value}" ]]; then
    return 1
  fi
  printf '%s' "${value}"
}

derive_health_url() {
  if [[ -n "${HEALTH_URL}" ]]; then
    return
  fi

  local app_port
  app_port="$(read_env_value APP_PORT || true)"
  if [[ -z "${app_port}" ]]; then
    app_port="23000"
  fi
  HEALTH_URL="http://127.0.0.1:${app_port}/api/actions/health"
}

detect_build_tool() {
  if [[ "${SKIP_BUILD}" == true ]]; then
    return
  fi

  if [[ -n "${BUILD_TOOL}" ]]; then
    require_command "${BUILD_TOOL}"
    return
  fi

  local candidate
  for candidate in bun pnpm npm; do
    if command -v "${candidate}" >/dev/null 2>&1; then
      BUILD_TOOL="${candidate}"
      return
    fi
  done

  log_error "No supported build tool found. Install bun, pnpm, or npm, or rerun with --skip-build."
  exit 1
}

maybe_start_proxy_bridge() {
  if [[ "${START_PROXY_BRIDGE}" != true ]]; then
    return
  fi

  if ! command -v systemctl >/dev/null 2>&1; then
    return
  fi

  if ! systemctl --user list-unit-files docker-loopback-proxy-7897.socket >/dev/null 2>&1; then
    return
  fi

  log_info "Ensuring docker-loopback-proxy-7897.socket is listening"
  run_cmd systemctl --user start docker-loopback-proxy-7897.socket
}

build_app() {
  if [[ "${SKIP_BUILD}" == true ]]; then
    log_info "Skipping app build"
    return
  fi

  log_info "Running production build in ${REPO_ROOT} with ${BUILD_TOOL}"
  if [[ "${DRY_RUN}" == true ]]; then
    case "${BUILD_TOOL}" in
      bun)
        printf '[DRY-RUN] (cd %q && bun run build)\n' "${REPO_ROOT}"
        ;;
      pnpm)
        printf '[DRY-RUN] (cd %q && pnpm build)\n' "${REPO_ROOT}"
        ;;
      npm)
        printf '[DRY-RUN] (cd %q && npm run build)\n' "${REPO_ROOT}"
        ;;
    esac
    return
  fi

  (
    cd "${REPO_ROOT}"
    case "${BUILD_TOOL}" in
      bun)
        bun run build
        ;;
      pnpm)
        pnpm build
        ;;
      npm)
        npm run build
        ;;
    esac
  )
}

sync_overlay_context() {
  if [[ "${SKIP_SYNC}" == true ]]; then
    log_info "Skipping local-build-context sync"
    return
  fi

  log_info "Syncing overlay build context to ${CONTEXT_DIR}"

  local required_paths=(
    "${REPO_ROOT}/Dockerfile.local-overlay"
    "${REPO_ROOT}/.next"
    "${REPO_ROOT}/public"
    "${REPO_ROOT}/messages"
  )
  local required_path
  for required_path in "${required_paths[@]}"; do
    if [[ ! -e "${required_path}" ]]; then
      log_error "Required overlay artifact is missing: ${required_path}"
      log_error "Run the script without --skip-build or build the app first."
      exit 1
    fi
  done

  run_cmd mkdir -p \
    "${CONTEXT_DIR}" \
    "${CONTEXT_DIR}/.next/standalone/.worktrees" \
    "${CONTEXT_DIR}/public" \
    "${CONTEXT_DIR}/messages"

  run_cmd install -m 0644 "${REPO_ROOT}/Dockerfile.local-overlay" "${RUNTIME_DIR}/Dockerfile.local-overlay"
  run_cmd rsync -a --delete "${REPO_ROOT}/.next/" "${CONTEXT_DIR}/.next/"
  run_cmd rsync -a --delete "${REPO_ROOT}/public/" "${CONTEXT_DIR}/public/"
  run_cmd rsync -a --delete "${REPO_ROOT}/messages/" "${CONTEXT_DIR}/messages/"
}

compose_up() {
  local recreate_args=()
  if [[ "${FORCE_RECREATE}" == true ]]; then
    recreate_args=(--force-recreate)
  fi

  log_info "Validating compose file"
  if [[ "${DRY_RUN}" == true ]]; then
    run_cmd docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" config
  else
    docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" config >/dev/null
  fi

  log_info "Ensuring postgres and redis are up"
  run_cmd docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" up -d postgres redis

  log_info "Rebuilding ${APP_SERVICE} with local overlay"
  run_cmd docker compose \
    -f "${COMPOSE_FILE}" \
    --project-directory "${RUNTIME_DIR}" \
    up -d --build "${recreate_args[@]}" "${APP_SERVICE}"
}

service_container_id() {
  docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" ps -q "${APP_SERVICE}" 2>/dev/null || true
}

app_health_status() {
  local container_id="$1"
  if [[ -z "${container_id}" ]]; then
    echo "missing"
    return
  fi
  docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || echo "unknown"
}

print_failure_context() {
  log_warning "Compose status:"
  docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" ps || true
  echo
  log_warning "Recent ${APP_SERVICE} logs:"
  docker compose -f "${COMPOSE_FILE}" --project-directory "${RUNTIME_DIR}" logs --tail=200 "${APP_SERVICE}" || true
}

wait_for_health() {
  local start_ts
  start_ts="$(date +%s)"

  log_info "Polling ${HEALTH_URL} for up to ${HEALTH_TIMEOUT_SECONDS}s"

  while true; do
    local now_ts elapsed container_id health_state http_ok=false
    now_ts="$(date +%s)"
    elapsed="$((now_ts - start_ts))"

    container_id="$(service_container_id)"
    health_state="$(app_health_status "${container_id}")"

    if curl -fsS -m 5 "${HEALTH_URL}" >/dev/null 2>&1; then
      http_ok=true
    fi

    if [[ "${http_ok}" == true && "${health_state}" == "healthy" ]]; then
      log_success "${APP_SERVICE} is healthy and ${HEALTH_URL} is reachable"
      return 0
    fi

    log_info "Waiting... container health=${health_state}, http_ok=${http_ok}, elapsed=${elapsed}s"

    if [[ "${elapsed}" -ge "${HEALTH_TIMEOUT_SECONDS}" ]]; then
      log_error "Health check timed out after ${HEALTH_TIMEOUT_SECONDS}s"
      print_failure_context
      return 1
    fi

    sleep 5
  done
}

print_summary() {
  echo
  log_success "Overlay repair completed"
  echo "Repo root:    ${REPO_ROOT}"
  echo "Runtime dir:  ${RUNTIME_DIR}"
  echo "Compose file: ${COMPOSE_FILE}"
  echo "Context dir:  ${CONTEXT_DIR}"
  echo "Health URL:   ${HEALTH_URL}"
  echo
  echo "Useful follow-up:"
  echo "  docker compose -f ${COMPOSE_FILE} --project-directory ${RUNTIME_DIR} ps"
  echo "  docker compose -f ${COMPOSE_FILE} --project-directory ${RUNTIME_DIR} logs -f ${APP_SERVICE}"
}

main() {
  parse_args "$@"
  detect_compose_file
  detect_paths
  validate_inputs
  derive_health_url
  detect_build_tool

  log_info "Repo root: ${REPO_ROOT}"
  log_info "Runtime dir: ${RUNTIME_DIR}"
  log_info "Compose file: ${COMPOSE_FILE}"
  log_info "Context dir: ${CONTEXT_DIR}"
  log_info "Health URL: ${HEALTH_URL}"
  if [[ "${SKIP_BUILD}" != true ]]; then
    log_info "Build tool: ${BUILD_TOOL}"
  fi

  maybe_start_proxy_bridge
  build_app
  sync_overlay_context
  compose_up

  if [[ "${DRY_RUN}" == true ]]; then
    log_success "Dry run completed"
    exit 0
  fi

  wait_for_health
  print_summary
}

main "$@"
