#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script version
VERSION="1.2.0"

# Logging functions (defined early for use in parse_args)
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Global variables
SUFFIX=""
ADMIN_TOKEN=""
DB_PASSWORD=""
DEPLOY_DIR=""
OS_TYPE=""
IMAGE_TAG="latest"
BRANCH_NAME="main"
APP_PORT="23000"
UPDATE_MODE=false
FORCE_NEW=false
RESTART_MODE=false
PROBE_ONLY=false
COMPOSE_FILE=""
ENV_FILE=""
APP_SERVICE="app"
RESTART_TIMEOUT_SECONDS=90
TAIL_LOG_LINES=80

# CLI argument variables
BRANCH_ARG=""
PORT_ARG=""
TOKEN_ARG=""
DIR_ARG=""
DOMAIN_ARG=""
ENABLE_CADDY=false
NON_INTERACTIVE=false

show_help() {
    cat << EOF
Claude Code Hub - One-Click Deployment Script v${VERSION}

Usage: $0 [OPTIONS]

Options:
  -b, --branch <name>        Branch to deploy: main (default) or dev
  -p, --port <port>          App external port (default: 23000)
  -t, --admin-token <token>  Custom admin token (default: auto-generated)
  -d, --deploy-dir <path>    Custom deployment directory
      --compose-file <path>  Existing compose file used by --restart/--probe-only
      --env-file <path>      Existing env file used by --restart/--probe-only
      --app-service <name>   App service name for probes (default: app)
      --restart              Restart an existing deployment and run probes
      --probe-only           Only run deployment probes; do not change containers
      --restart-timeout <s>  Probe timeout for --restart/--probe-only (default: 90)
      --tail-log-lines <n>   Lines of logs to show on probe failure (default: 80)
      --domain <domain>      Domain for Caddy HTTPS (enables Caddy automatically)
      --enable-caddy         Enable Caddy reverse proxy without HTTPS (HTTP only)
      --force-new            Force fresh installation (ignore existing deployment)
  -y, --yes                  Non-interactive mode (skip prompts, use defaults)
  -h, --help                 Show this help message

Examples:
  $0                                    # Interactive deployment
  $0 -y                                 # Non-interactive with defaults
  $0 -b dev -p 8080 -y                  # Deploy dev branch on port 8080
  $0 -t "my-secure-token" -y            # Use custom admin token
  $0 --domain hub.example.com -y        # Deploy with Caddy HTTPS
  $0 --enable-caddy -y                  # Deploy with Caddy HTTP-only
  $0 -y                                 # Update existing deployment (auto-detected)
  $0 --force-new -y                     # Force fresh install even if deployment exists
  $0 --restart -d /path/to/runtime -y   # Restart an existing deployment
  $0 --probe-only -d /path/to/runtime -y

For more information, visit: https://github.com/ding113/claude-code-hub
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--branch)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                BRANCH_ARG="$2"
                shift 2
                ;;
            -p|--port)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                PORT_ARG="$2"
                shift 2
                ;;
            -t|--admin-token)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                TOKEN_ARG="$2"
                shift 2
                ;;
            -d|--deploy-dir)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                DIR_ARG="$2"
                shift 2
                ;;
            --compose-file)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                COMPOSE_FILE="$2"
                shift 2
                ;;
            --env-file)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                ENV_FILE="$2"
                shift 2
                ;;
            --app-service)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                APP_SERVICE="$2"
                shift 2
                ;;
            --restart)
                RESTART_MODE=true
                shift
                ;;
            --probe-only)
                PROBE_ONLY=true
                shift
                ;;
            --restart-timeout)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                RESTART_TIMEOUT_SECONDS="$2"
                shift 2
                ;;
            --tail-log-lines)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                TAIL_LOG_LINES="$2"
                shift 2
                ;;
            --domain)
                if [[ -z "${2:-}" ]] || [[ "$2" == -* ]]; then
                    log_error "Option $1 requires an argument"
                    exit 1
                fi
                DOMAIN_ARG="$2"
                ENABLE_CADDY=true
                shift 2
                ;;
            --enable-caddy)
                ENABLE_CADDY=true
                shift
                ;;
            --force-new)
                FORCE_NEW=true
                shift
                ;;
            -y|--yes)
                NON_INTERACTIVE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo ""
                show_help
                exit 1
                ;;
        esac
    done
}

validate_inputs() {
    # Validate port
    if [[ -n "$PORT_ARG" ]]; then
        if ! [[ "$PORT_ARG" =~ ^[0-9]+$ ]] || [[ "$PORT_ARG" -lt 1 ]] || [[ "$PORT_ARG" -gt 65535 ]]; then
            log_error "Invalid port number: $PORT_ARG (must be 1-65535)"
            exit 1
        fi
        APP_PORT="$PORT_ARG"
    fi

    # Validate admin token length
    if [[ -n "$TOKEN_ARG" ]]; then
        if [[ ${#TOKEN_ARG} -lt 16 ]]; then
            log_error "Admin token too short: minimum 16 characters required"
            exit 1
        fi
        ADMIN_TOKEN="$TOKEN_ARG"
    fi

    # Validate branch
    if [[ -n "$BRANCH_ARG" ]]; then
        case "$BRANCH_ARG" in
            main)
                IMAGE_TAG="latest"
                BRANCH_NAME="main"
                ;;
            dev)
                IMAGE_TAG="dev"
                BRANCH_NAME="dev"
                ;;
            *)
                log_error "Invalid branch: $BRANCH_ARG (must be 'main' or 'dev')"
                exit 1
                ;;
        esac
    fi

    # Apply custom deploy directory
    if [[ -n "$DIR_ARG" ]]; then
        DEPLOY_DIR="$DIR_ARG"
    fi

    # Validate domain format if provided
    if [[ -n "$DOMAIN_ARG" ]]; then
        if ! [[ "$DOMAIN_ARG" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
            log_error "Invalid domain format: $DOMAIN_ARG"
            exit 1
        fi
    fi

    if [[ "${RESTART_MODE}" == true && "${PROBE_ONLY}" == true ]]; then
        log_error "--restart and --probe-only cannot be used together"
        exit 1
    fi

    if ! [[ "${RESTART_TIMEOUT_SECONDS}" =~ ^[0-9]+$ ]] || [[ "${RESTART_TIMEOUT_SECONDS}" -lt 5 ]]; then
        log_error "Invalid --restart-timeout: ${RESTART_TIMEOUT_SECONDS}"
        exit 1
    fi

    if ! [[ "${TAIL_LOG_LINES}" =~ ^[0-9]+$ ]] || [[ "${TAIL_LOG_LINES}" -lt 1 ]]; then
        log_error "Invalid --tail-log-lines: ${TAIL_LOG_LINES}"
        exit 1
    fi
}

print_header() {
    echo -e "${BLUE}"
    echo "+=================================================================+"
    echo "|                                                                 |"
    echo "|           Claude Code Hub - One-Click Deployment               |"
    echo "|                      Version ${VERSION}                             |"
    echo "|                                                                 |"
    echo "+=================================================================+"
    echo -e "${NC}"
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="linux"
        DEPLOY_DIR="/www/compose/claude-code-hub"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macos"
        DEPLOY_DIR="$HOME/Applications/claude-code-hub"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    log_info "Detected OS: $OS_TYPE"
}

select_branch() {
    # Skip if branch already set via CLI or non-interactive mode
    if [[ -n "$BRANCH_ARG" ]]; then
        log_info "Using branch from CLI argument: $BRANCH_NAME"
        return
    fi

    if [[ "$NON_INTERACTIVE" == true ]]; then
        log_info "Non-interactive mode: using default branch (main)"
        return
    fi

    echo ""
    echo -e "${BLUE}Please select the branch to deploy:${NC}"
    echo -e "  ${GREEN}1)${NC} main   (Stable release - recommended for production)"
    echo -e "  ${YELLOW}2)${NC} dev    (Latest features - for testing)"
    echo ""
    
    local choice
    while true; do
        read -p "Enter your choice [1]: " choice
        choice=${choice:-1}
        
        case $choice in
            1)
                IMAGE_TAG="latest"
                BRANCH_NAME="main"
                log_success "Selected branch: main (image tag: latest)"
                break
                ;;
            2)
                IMAGE_TAG="dev"
                BRANCH_NAME="dev"
                log_success "Selected branch: dev (image tag: dev)"
                break
                ;;
            *)
                log_error "Invalid choice. Please enter 1 or 2."
                ;;
        esac
    done
}

check_docker() {
    log_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed"
        return 1
    fi
    
    if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
        log_warning "Docker Compose is not installed"
        return 1
    fi
    
    log_success "Docker and Docker Compose are installed"
    docker --version
    docker compose version 2>/dev/null || docker-compose --version
    return 0
}

install_docker() {
    log_info "Installing Docker..."
    
    if [[ "$OS_TYPE" == "linux" ]]; then
        if [[ $EUID -ne 0 ]]; then
            log_error "Docker installation requires root privileges on Linux"
            log_info "Please run: sudo $0"
            exit 1
        fi
    fi
    
    log_info "Downloading Docker installation script from get.docker.com..."
    local temp_script
    temp_script=$(mktemp)
    if curl -fsSL https://get.docker.com -o "$temp_script"; then
        log_info "Running Docker installation script..."
        sh "$temp_script"
        rm -f "$temp_script"
        
        if [[ "$OS_TYPE" == "linux" ]]; then
            log_info "Starting Docker service..."
            systemctl start docker
            systemctl enable docker
            
            if [[ -n "$SUDO_USER" ]]; then
                log_info "Adding user $SUDO_USER to docker group..."
                usermod -aG docker "$SUDO_USER"
                log_warning "Please log out and log back in for group changes to take effect"
            fi
        fi
        
        log_success "Docker installed successfully"
    else
        log_error "Failed to download Docker installation script"
        exit 1
    fi
}

generate_random_suffix() {
    SUFFIX=$(tr -dc 'a-z0-9' < /dev/urandom | head -c 4)
    log_info "Generated random suffix: $SUFFIX"
}

generate_admin_token() {
    # Skip if token already set via CLI
    if [[ -n "$ADMIN_TOKEN" ]]; then
        log_info "Using admin token from CLI argument"
        return
    fi

    if command -v openssl &> /dev/null; then
        ADMIN_TOKEN=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    else
        ADMIN_TOKEN=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)
    fi
    log_info "Generated secure admin token"
}

generate_db_password() {
    if command -v openssl &> /dev/null; then
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    else
        DB_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24)
    fi
    log_info "Generated secure database password"
}

detect_existing_deployment() {
    if [[ "$FORCE_NEW" == true ]]; then
        log_info "Force-new flag set, skipping existing deployment detection"
        return 1
    fi
    if [[ -f "$DEPLOY_DIR/.env" ]] && [[ -f "$DEPLOY_DIR/docker-compose.yaml" ]]; then
        log_info "Detected existing deployment in $DEPLOY_DIR"
        UPDATE_MODE=true
        return 0
    fi
    return 1
}

extract_suffix_from_compose() {
    local compose_file="$DEPLOY_DIR/docker-compose.yaml"
    SUFFIX=$(sed -n 's/.*container_name: claude-code-hub-db-\([a-z0-9]*\)/\1/p' "$compose_file" | head -1)
    if [[ -z "$SUFFIX" ]]; then
        log_warning "Could not extract suffix from docker-compose.yaml, generating new one"
        generate_random_suffix
        return
    fi
    log_info "Using existing suffix: $SUFFIX"
}

load_existing_env() {
    local env_file="$DEPLOY_DIR/.env"

    # Load DB_PASSWORD
    local existing_db_pw
    existing_db_pw=$(grep '^DB_PASSWORD=' "$env_file" | head -1 | cut -d'=' -f2-)
    if [[ -n "$existing_db_pw" ]]; then
        DB_PASSWORD="$existing_db_pw"
        log_info "Preserved existing database password"
    else
        log_warning "DB_PASSWORD not found in existing .env, generating new one"
        generate_db_password
    fi

    # Load ADMIN_TOKEN (CLI argument takes priority)
    if [[ -z "$ADMIN_TOKEN" ]]; then
        local existing_token
        existing_token=$(grep '^ADMIN_TOKEN=' "$env_file" | head -1 | cut -d'=' -f2-)
        if [[ -n "$existing_token" ]]; then
            ADMIN_TOKEN="$existing_token"
            log_info "Preserved existing admin token"
        else
            log_warning "ADMIN_TOKEN not found in existing .env, generating new one"
            generate_admin_token
        fi
    fi

    # Load APP_PORT (CLI argument takes priority)
    if [[ -z "$PORT_ARG" ]]; then
        local existing_port
        existing_port=$(grep '^APP_PORT=' "$env_file" | head -1 | cut -d'=' -f2-)
        if [[ -n "$existing_port" ]]; then
            APP_PORT="$existing_port"
        fi
    fi
}

resolve_runtime_paths() {
    if [[ -z "$COMPOSE_FILE" ]]; then
        if [[ -f "$DEPLOY_DIR/docker-compose.archbox.yaml" ]]; then
            COMPOSE_FILE="$DEPLOY_DIR/docker-compose.archbox.yaml"
        elif [[ -f "$DEPLOY_DIR/docker-compose.yaml" ]]; then
            COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yaml"
        else
            COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yaml"
        fi
    fi

    if [[ -z "$ENV_FILE" ]]; then
        ENV_FILE="$DEPLOY_DIR/.env"
    fi
}

compose_cmd() {
    local compose_args=()
    if [[ -n "$ENV_FILE" ]] && [[ -f "$ENV_FILE" ]]; then
        compose_args+=(--env-file "$ENV_FILE")
    fi

    if docker compose version &> /dev/null; then
        (
            cd "$DEPLOY_DIR"
            docker compose -f "$COMPOSE_FILE" "${compose_args[@]}" "$@"
        )
    else
        (
            cd "$DEPLOY_DIR"
            docker-compose -f "$COMPOSE_FILE" "${compose_args[@]}" "$@"
        )
    fi
}

compose_command_hint() {
    local deploy_dir_quoted
    local compose_file_quoted
    local env_file_quoted
    printf -v deploy_dir_quoted '%q' "$DEPLOY_DIR"
    printf -v compose_file_quoted '%q' "$COMPOSE_FILE"
    printf -v env_file_quoted '%q' "$ENV_FILE"

    local compose_flag=""
    local env_flag=""
    if [[ "$COMPOSE_FILE" != "$DEPLOY_DIR/docker-compose.yaml" ]]; then
        compose_flag="-f ${compose_file_quoted} "
    fi
    if [[ -n "$ENV_FILE" ]] && [[ "$ENV_FILE" != "$DEPLOY_DIR/.env" ]]; then
        env_flag="--env-file ${env_file_quoted} "
    fi
    echo "cd ${deploy_dir_quoted} && docker compose ${compose_flag}${env_flag}"
}

get_env_value() {
    local key="$1"
    local default_value="${2:-}"

    if [[ -f "$ENV_FILE" ]]; then
        local value
        value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2- || true)
        if [[ -n "$value" ]]; then
            echo "$value"
            return 0
        fi
    fi

    echo "$default_value"
}

get_runtime_app_port() {
    get_env_value "APP_PORT" "$APP_PORT"
}

list_runtime_services() {
    local services
    services=$(compose_cmd config --services 2>/dev/null || true)
    if [[ -n "$services" ]]; then
        printf '%s\n' "$services"
        return 0
    fi

    printf '%s\n' "postgres" "redis" "$APP_SERVICE"
}

service_container_id() {
    local service_name="$1"
    compose_cmd ps -q "$service_name" 2>/dev/null | head -n 1
}

container_name_from_id() {
    local container_id="$1"
    if [[ -z "$container_id" ]]; then
        return 1
    fi
    docker inspect --format='{{.Name}}' "$container_id" 2>/dev/null | sed 's#^/##'
}

container_state_from_id() {
    local container_id="$1"
    if [[ -z "$container_id" ]]; then
        return 1
    fi
    docker inspect --format='{{.State.Status}}' "$container_id" 2>/dev/null
}

container_health_from_id() {
    local container_id="$1"
    if [[ -z "$container_id" ]]; then
        return 1
    fi
    docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null
}

container_ports_from_id() {
    local container_id="$1"
    if [[ -z "$container_id" ]]; then
        return 1
    fi

    local ports
    ports=$(docker port "$container_id" 2>/dev/null | paste -sd ', ' - || true)
    if [[ -z "$ports" ]]; then
        echo "none"
        return 0
    fi
    echo "$ports"
}

probe_host_health_silent() {
    local app_port="$1"
    curl -fsS -m 5 "http://127.0.0.1:${app_port}/api/actions/health" >/dev/null 2>&1
}

probe_container_health_silent() {
    local container_id="$1"
    local app_port="$2"
    docker exec "$container_id" sh -lc "curl -fsS -m 5 http://127.0.0.1:${app_port}/api/actions/health >/dev/null" >/dev/null 2>&1
}

print_host_health_probe() {
    local app_port="$1"
    local url="http://127.0.0.1:${app_port}/api/actions/health"
    local http_code
    http_code=$(curl -sS -m 5 -o /tmp/cch-deploy-health-host.txt -w '%{http_code}' "$url" 2>/tmp/cch-deploy-health-host.err || true)

    if [[ "$http_code" == "200" ]]; then
        log_success "Host health probe: ${url} -> 200"
        return 0
    fi

    local err_msg=""
    if [[ -f /tmp/cch-deploy-health-host.err ]]; then
        err_msg=$(tr '\n' ' ' < /tmp/cch-deploy-health-host.err | sed 's/[[:space:]]\+/ /g' | sed 's/^ //; s/ $//')
    fi
    if [[ -z "$err_msg" ]]; then
        err_msg="HTTP ${http_code:-unknown}"
    fi
    log_warning "Host health probe: ${url} -> ${err_msg}"
    return 1
}

print_container_health_probe() {
    local container_id="$1"
    local container_name="$2"
    local app_port="$3"
    local probe_output

    probe_output=$(docker exec "$container_id" sh -lc "curl -sS -m 5 http://127.0.0.1:${app_port}/api/actions/health" 2>&1 || true)
    if [[ "$probe_output" == *'"status":"ok"'* ]]; then
        log_success "Container health probe: ${container_name} -> ok"
        return 0
    fi

    local truncated
    truncated=$(printf '%s' "$probe_output" | head -c 160)
    if [[ -z "$truncated" ]]; then
        truncated="probe returned no output"
    fi
    log_warning "Container health probe: ${container_name} -> ${truncated}"
    return 1
}

print_runtime_probe() {
    local app_port="$1"
    local ready=1

    echo ""
    log_info "Runtime probe summary"
    echo "  deploy_dir: $DEPLOY_DIR"
    echo "  compose_file: $COMPOSE_FILE"
    echo "  env_file: $ENV_FILE"
    echo "  app_service: $APP_SERVICE"
    echo "  app_port: $app_port"
    echo ""

    log_info "docker compose ps"
    compose_cmd ps || true
    echo ""

    while IFS= read -r service_name; do
        [[ -z "$service_name" ]] && continue

        local container_id
        container_id=$(service_container_id "$service_name")
        if [[ -z "$container_id" ]]; then
            log_warning "service=${service_name} container=missing"
            continue
        fi

        local container_name
        local container_state
        local container_health
        local container_ports
        container_name=$(container_name_from_id "$container_id")
        container_state=$(container_state_from_id "$container_id")
        container_health=$(container_health_from_id "$container_id")
        container_ports=$(container_ports_from_id "$container_id")

        echo "  service=${service_name} container=${container_name:-unknown} state=${container_state:-unknown} health=${container_health:-unknown} ports=${container_ports:-none}"

        if [[ "$service_name" == "$APP_SERVICE" ]] && [[ "$container_health" == "healthy" ]]; then
            ready=0
        fi
    done < <(list_runtime_services)
    echo ""

    if print_host_health_probe "$app_port"; then
        ready=0
    fi

    local app_container_id
    app_container_id=$(service_container_id "$APP_SERVICE")
    if [[ -n "$app_container_id" ]]; then
        local app_container_name
        app_container_name=$(container_name_from_id "$app_container_id")
        if print_container_health_probe "$app_container_id" "${app_container_name:-$APP_SERVICE}" "$app_port"; then
            ready=0
        fi
    else
        log_warning "App service container is missing; skipping container health probe"
    fi

    return "$ready"
}

runtime_ready() {
    local app_port="$1"
    local app_container_id
    app_container_id=$(service_container_id "$APP_SERVICE")
    if [[ -z "$app_container_id" ]]; then
        return 1
    fi

    local container_health
    container_health=$(container_health_from_id "$app_container_id")
    if [[ "$container_health" == "healthy" ]]; then
        return 0
    fi

    if probe_container_health_silent "$app_container_id" "$app_port"; then
        return 0
    fi

    if probe_host_health_silent "$app_port"; then
        return 0
    fi

    return 1
}

print_runtime_failure_logs() {
    log_warning "Recent ${APP_SERVICE} logs (tail ${TAIL_LOG_LINES})"
    compose_cmd logs --tail "$TAIL_LOG_LINES" "$APP_SERVICE" || true
}

wait_for_runtime_ready() {
    local app_port="$1"
    log_info "Waiting for runtime readiness (max ${RESTART_TIMEOUT_SECONDS} seconds)..."

    local elapsed=0
    while [[ "$elapsed" -lt "$RESTART_TIMEOUT_SECONDS" ]]; do
        if runtime_ready "$app_port"; then
            log_success "Runtime probes passed"
            return 0
        fi

        local app_container_id
        local state="missing"
        local health="missing"
        app_container_id=$(service_container_id "$APP_SERVICE")
        if [[ -n "$app_container_id" ]]; then
            state=$(container_state_from_id "$app_container_id")
            health=$(container_health_from_id "$app_container_id")
        fi

        log_info "Probe attempt ${elapsed}s/${RESTART_TIMEOUT_SECONDS}s: app state=${state:-unknown}, health=${health:-unknown}"
        sleep 5
        elapsed=$((elapsed + 5))
    done

    log_warning "Runtime did not become ready within ${RESTART_TIMEOUT_SECONDS} seconds"
    return 1
}

restart_runtime() {
    local app_port="$1"

    log_info "Restarting existing deployment"
    if ! compose_cmd restart; then
        log_warning "docker compose restart failed; falling back to docker compose up -d"
        compose_cmd up -d
    fi

    if wait_for_runtime_ready "$app_port"; then
        print_runtime_probe "$app_port" || true
        return 0
    fi

    print_runtime_probe "$app_port" || true
    print_runtime_failure_logs
    return 1
}

run_runtime_mode() {
    resolve_runtime_paths

    if [[ ! -d "$DEPLOY_DIR" ]]; then
        log_error "Deployment directory does not exist: $DEPLOY_DIR"
        exit 1
    fi

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Compose file does not exist: $COMPOSE_FILE"
        exit 1
    fi

    local app_port
    app_port=$(get_runtime_app_port)

    if [[ "$PROBE_ONLY" == true ]]; then
        log_info "=== PROBE MODE ==="
        print_runtime_probe "$app_port"
        return $?
    fi

    log_info "=== RESTART MODE ==="
    print_runtime_probe "$app_port" || true
    restart_runtime "$app_port"
}

create_deployment_dir() {
    log_info "Creating deployment directory: $DEPLOY_DIR"
    
    if [[ "$OS_TYPE" == "linux" ]] && [[ ! -d "/www" ]]; then
        if [[ $EUID -ne 0 ]]; then
            log_error "Creating /www directory requires root privileges"
            log_info "Please run: sudo $0"
            exit 1
        fi
        mkdir -p "$DEPLOY_DIR"
        if [[ -n "$SUDO_USER" ]]; then
            chown -R "$SUDO_USER:$SUDO_USER" /www
        fi
    else
        mkdir -p "$DEPLOY_DIR"
    fi
    
    mkdir -p "$DEPLOY_DIR/data/postgres"
    mkdir -p "$DEPLOY_DIR/data/redis"
    
    log_success "Deployment directory created"
}

write_compose_file() {
    log_info "Writing docker-compose.yaml..."
    
    # Determine app ports configuration
    local app_ports_config
    if [[ "$ENABLE_CADDY" == true ]]; then
        # When Caddy is enabled, don't expose app port externally
        app_ports_config=""
    else
        app_ports_config="ports:
      - \"\${APP_PORT:-${APP_PORT}}:\${APP_PORT:-${APP_PORT}}\""
    fi

    cat > "$DEPLOY_DIR/docker-compose.yaml" << EOF
services:
  postgres:
    image: postgres:18
    container_name: claude-code-hub-db-${SUFFIX}
    restart: unless-stopped
    ports:
      - "127.0.0.1:35432:5432"
    env_file:
      - ./.env
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
      POSTGRES_DB: \${DB_NAME:-claude_code_hub}
      PGDATA: /data/pgdata
      TZ: Asia/Shanghai
      PGTZ: Asia/Shanghai
    volumes:
      - ./data/postgres:/data
    networks:
      - claude-code-hub-net-${SUFFIX}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres} -d \${DB_NAME:-claude_code_hub}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  redis:
    image: redis:7-alpine
    container_name: claude-code-hub-redis-${SUFFIX}
    restart: unless-stopped
    volumes:
      - ./data/redis:/data
    command: redis-server --appendonly yes
    networks:
      - claude-code-hub-net-${SUFFIX}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s

  app:
    image: ghcr.io/ding113/claude-code-hub:${IMAGE_TAG}
    container_name: claude-code-hub-app-${SUFFIX}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - ./.env
    environment:
      NODE_ENV: production
      PORT: \${APP_PORT:-${APP_PORT}}
      DSN: postgresql://\${DB_USER:-postgres}:\${DB_PASSWORD:-postgres}@claude-code-hub-db-${SUFFIX}:5432/\${DB_NAME:-claude_code_hub}
      REDIS_URL: redis://claude-code-hub-redis-${SUFFIX}:6379
      AUTO_MIGRATE: \${AUTO_MIGRATE:-true}
      ENABLE_RATE_LIMIT: \${ENABLE_RATE_LIMIT:-true}
      SESSION_TTL: \${SESSION_TTL:-300}
      TZ: Asia/Shanghai
EOF

    # Add app ports only if Caddy is not enabled
    if [[ "$ENABLE_CADDY" != true ]]; then
        cat >> "$DEPLOY_DIR/docker-compose.yaml" << EOF
    ports:
      - "\${APP_PORT:-${APP_PORT}}:\${APP_PORT:-${APP_PORT}}"
EOF
    fi

    cat >> "$DEPLOY_DIR/docker-compose.yaml" << EOF
    restart: unless-stopped
    networks:
      - claude-code-hub-net-${SUFFIX}
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:\${APP_PORT:-${APP_PORT}}/api/actions/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
EOF

    # Add Caddy service if enabled
    if [[ "$ENABLE_CADDY" == true ]]; then
        cat >> "$DEPLOY_DIR/docker-compose.yaml" << EOF

  caddy:
    image: caddy:2-alpine
    container_name: claude-code-hub-caddy-${SUFFIX}
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      app:
        condition: service_healthy
    networks:
      - claude-code-hub-net-${SUFFIX}
EOF
    fi

    cat >> "$DEPLOY_DIR/docker-compose.yaml" << EOF

networks:
  claude-code-hub-net-${SUFFIX}:
    driver: bridge
    name: claude-code-hub-net-${SUFFIX}
EOF

    # Add Caddy volumes if enabled
    if [[ "$ENABLE_CADDY" == true ]]; then
        cat >> "$DEPLOY_DIR/docker-compose.yaml" << EOF

volumes:
  caddy_data:
  caddy_config:
EOF
    fi
    
    log_success "docker-compose.yaml created"
}

write_caddyfile() {
    if [[ "$ENABLE_CADDY" != true ]]; then
        return
    fi

    log_info "Writing Caddyfile..."

    if [[ -n "$DOMAIN_ARG" ]]; then
        # HTTPS mode with domain (Let's Encrypt automatic)
        cat > "$DEPLOY_DIR/Caddyfile" << EOF
${DOMAIN_ARG} {
    reverse_proxy app:${APP_PORT}
    encode gzip
}
EOF
        log_success "Caddyfile created (HTTPS mode with domain: $DOMAIN_ARG)"
    else
        # HTTP-only mode
        cat > "$DEPLOY_DIR/Caddyfile" << EOF
:80 {
    reverse_proxy app:${APP_PORT}
    encode gzip
}
EOF
        log_success "Caddyfile created (HTTP-only mode)"
    fi
}

write_env_file() {
    log_info "Writing .env file..."

    # Update mode: backup existing .env, then restore custom variables after writing
    local backup_file=""
    if [[ "$UPDATE_MODE" == true ]] && [[ -f "$DEPLOY_DIR/.env" ]]; then
        backup_file="$DEPLOY_DIR/.env.bak"
        cp "$DEPLOY_DIR/.env" "$backup_file"
        log_info "Backed up existing .env to .env.bak"
    fi
    
    # Determine secure cookies setting based on Caddy and domain
    local secure_cookies="true"
    if [[ "$ENABLE_CADDY" == true ]] && [[ -z "$DOMAIN_ARG" ]]; then
        # HTTP-only Caddy mode - disable secure cookies
        secure_cookies="false"
    fi

    # If domain is set, APP_URL should use https
    local app_url=""
    if [[ -n "$DOMAIN_ARG" ]]; then
        app_url="https://${DOMAIN_ARG}"
    fi
    
    cat > "$DEPLOY_DIR/.env" << EOF
# Admin Token (KEEP THIS SECRET!)
ADMIN_TOKEN=${ADMIN_TOKEN}

# Database Configuration
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=claude_code_hub

# Application Configuration
APP_PORT=${APP_PORT}
APP_URL=${app_url}

# Auto Migration (enabled for first-time setup)
AUTO_MIGRATE=true

# Redis Configuration
ENABLE_RATE_LIMIT=true

# Session Configuration
SESSION_TTL=300
STORE_SESSION_MESSAGES=false
STORE_SESSION_RESPONSE_BODY=true

# Cookie Security
ENABLE_SECURE_COOKIES=${secure_cookies}

# Circuit Breaker Configuration
ENABLE_CIRCUIT_BREAKER_ON_NETWORK_ERRORS=false
ENABLE_ENDPOINT_CIRCUIT_BREAKER=false

# Environment
NODE_ENV=production
TZ=Asia/Shanghai
LOG_LEVEL=info
EOF

    # Restore user custom variables from backup (variables not managed by this script)
    if [[ -n "$backup_file" ]] && [[ -f "$backup_file" ]]; then
        local managed_keys="ADMIN_TOKEN|DB_USER|DB_PASSWORD|DB_NAME|APP_PORT|APP_URL|AUTO_MIGRATE|ENABLE_RATE_LIMIT|SESSION_TTL|STORE_SESSION_MESSAGES|STORE_SESSION_RESPONSE_BODY|ENABLE_SECURE_COOKIES|ENABLE_CIRCUIT_BREAKER_ON_NETWORK_ERRORS|ENABLE_ENDPOINT_CIRCUIT_BREAKER|NODE_ENV|TZ|LOG_LEVEL"
        local custom_vars
        custom_vars=$(grep -v '^\s*#' "$backup_file" | grep -v '^\s*$' | grep -vE "^($managed_keys)=" || true)
        if [[ -n "$custom_vars" ]]; then
            echo "" >> "$DEPLOY_DIR/.env"
            echo "# User Custom Configuration (preserved from previous deployment)" >> "$DEPLOY_DIR/.env"
            echo "$custom_vars" >> "$DEPLOY_DIR/.env"
            log_info "Preserved $(echo "$custom_vars" | wc -l | tr -d ' ') custom environment variables"
        fi
    fi

    # W-015: restrict .env file permissions to prevent sensitive data leaks
    chmod 600 "$DEPLOY_DIR/.env"

    log_success ".env file created"
}

start_services() {
    log_info "Starting Docker services..."

    compose_cmd pull
    compose_cmd up -d

    log_success "Docker services started"
}

wait_for_health() {
    local app_port
    app_port=$(get_runtime_app_port)

    if wait_for_runtime_ready "$app_port"; then
        print_runtime_probe "$app_port" || true
        return 0
    fi

    print_runtime_probe "$app_port" || true
    print_runtime_failure_logs
    log_warning "Services did not become healthy within ${RESTART_TIMEOUT_SECONDS} seconds"
    log_info "You can check the logs with: $(compose_command_hint)logs -f"
    return 1
}

get_network_addresses() {
    local addresses=()
    
    if [[ "$OS_TYPE" == "linux" ]]; then
        if command -v ip &> /dev/null; then
            while IFS= read -r line; do
                addresses+=("$line")
            done < <(ip addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '^127\.' | grep -v '^172\.17\.' | grep -v '^169\.254\.')
        elif command -v ifconfig &> /dev/null; then
            while IFS= read -r line; do
                addresses+=("$line")
            done < <(ifconfig 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '^127\.' | grep -v '^172\.17\.' | grep -v '^169\.254\.')
        fi
    elif [[ "$OS_TYPE" == "macos" ]]; then
        while IFS= read -r line; do
            addresses+=("$line")
        done < <(ifconfig 2>/dev/null | grep 'inet ' | awk '{print $2}' | grep -v '^127\.' | grep -v '^169\.254\.')
    fi
    
    addresses+=("localhost")
    
    printf '%s\n' "${addresses[@]}"
}

print_success_message() {
    local addresses=($(get_network_addresses))
    
    echo ""
    echo -e "${GREEN}+================================================================+${NC}"
    echo -e "${GREEN}|                                                                |${NC}"
    if [[ "$UPDATE_MODE" == true ]]; then
        echo -e "${GREEN}|          Claude Code Hub Updated Successfully!                |${NC}"
    else
        echo -e "${GREEN}|          Claude Code Hub Deployed Successfully!               |${NC}"
    fi
    echo -e "${GREEN}|                                                                |${NC}"
    echo -e "${GREEN}+================================================================+${NC}"
    echo ""
    echo -e "${BLUE}Deployment Directory:${NC}"
    echo -e "   $DEPLOY_DIR"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"

    if [[ "$ENABLE_CADDY" == true ]]; then
        if [[ -n "$DOMAIN_ARG" ]]; then
            # HTTPS mode with domain
            echo -e "   ${GREEN}https://${DOMAIN_ARG}${NC}"
        else
            # HTTP-only Caddy mode
            for addr in "${addresses[@]}"; do
                echo -e "   ${GREEN}http://${addr}${NC}"
            done
        fi
    else
        # Direct app access
        for addr in "${addresses[@]}"; do
            echo -e "   ${GREEN}http://${addr}:${APP_PORT}${NC}"
        done
    fi

    echo ""

    # In update mode, skip printing the admin token (user already knows it)
    if [[ "$UPDATE_MODE" != true ]]; then
        echo -e "${BLUE}Admin Token (KEEP THIS SECRET!):${NC}"
        echo -e "   ${YELLOW}${ADMIN_TOKEN}${NC}"
        echo ""
    fi

    echo -e "${BLUE}Usage Documentation:${NC}"
    if [[ "$ENABLE_CADDY" == true ]] && [[ -n "$DOMAIN_ARG" ]]; then
        echo -e "   Chinese: ${GREEN}https://${DOMAIN_ARG}/zh-CN/usage-doc${NC}"
        echo -e "   English: ${GREEN}https://${DOMAIN_ARG}/en-US/usage-doc${NC}"
    else
        local first_addr="${addresses[0]}"
        local port_suffix=""
        if [[ "$ENABLE_CADDY" != true ]]; then
            port_suffix=":${APP_PORT}"
        fi
        echo -e "   Chinese: ${GREEN}http://${first_addr}${port_suffix}/zh-CN/usage-doc${NC}"
        echo -e "   English: ${GREEN}http://${first_addr}${port_suffix}/en-US/usage-doc${NC}"
    fi
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    local compose_hint
    compose_hint=$(compose_command_hint)
    echo -e "   View logs:    ${YELLOW}${compose_hint}logs -f${NC}"
    echo -e "   Stop services: ${YELLOW}${compose_hint}down${NC}"
    echo -e "   Restart:      ${YELLOW}${compose_hint}restart${NC}"

    if [[ "$ENABLE_CADDY" == true ]]; then
        echo ""
        echo -e "${BLUE}Caddy Configuration:${NC}"
        if [[ -n "$DOMAIN_ARG" ]]; then
            echo -e "   Mode: HTTPS with Let's Encrypt (domain: $DOMAIN_ARG)"
            echo -e "   Ports: 80 (HTTP redirect), 443 (HTTPS)"
        else
            echo -e "   Mode: HTTP-only reverse proxy"
            echo -e "   Port: 80"
        fi
    fi

    echo ""
    if [[ "$UPDATE_MODE" != true ]]; then
        echo -e "${RED}IMPORTANT: Please save the admin token in a secure location!${NC}"
    else
        echo -e "${BLUE}NOTE: Your existing secrets and custom configuration have been preserved.${NC}"
    fi
    echo ""
}

main() {
    # Parse CLI arguments first
    parse_args "$@"
    
    print_header
    
    detect_os
    
    # Apply CLI overrides after OS detection (for deploy dir)
    validate_inputs
    
    if ! check_docker; then
        log_warning "Docker is not installed. Attempting to install..."
        install_docker
        
        if ! check_docker; then
            log_error "Docker installation failed. Please install Docker manually."
            exit 1
        fi
    fi

    if [[ "$RESTART_MODE" == true || "$PROBE_ONLY" == true ]]; then
        run_runtime_mode
        exit $?
    fi
    
    select_branch

    # Key branch: detect existing deployment
    if detect_existing_deployment; then
        log_info "=== UPDATE MODE ==="
        log_info "Updating existing deployment (secrets and custom config will be preserved)"
        extract_suffix_from_compose
        load_existing_env
    else
        log_info "=== FRESH INSTALL MODE ==="
        generate_random_suffix
        generate_admin_token
        generate_db_password
    fi
    
    create_deployment_dir
    write_compose_file
    write_caddyfile
    write_env_file

    COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yaml"
    ENV_FILE="$DEPLOY_DIR/.env"
    
    start_services
    
    if wait_for_health; then
        print_success_message
    else
        if [[ "$UPDATE_MODE" == true ]]; then
            log_warning "Update completed but some services may not be fully healthy yet"
        else
            log_warning "Deployment completed but some services may not be fully healthy yet"
        fi
        log_info "Please check the logs: $(compose_command_hint)logs -f"
        print_success_message
    fi
}

main "$@"
