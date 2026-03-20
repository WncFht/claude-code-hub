#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REMOTE="${SYNC_UPSTREAM_REMOTE:-upstream}"
ORIGIN_REMOTE="${SYNC_ORIGIN_REMOTE:-origin}"
UPSTREAM_URL="${SYNC_UPSTREAM_URL:-git@github.com:ding113/claude-code-hub.git}"
LOCAL_MAIN_BRANCH="${SYNC_MAIN_BRANCH:-main}"
UPSTREAM_BRANCH="${SYNC_UPSTREAM_BRANCH:-main}"
SYNC_BRANCH_PREFIX="${SYNC_BRANCH_PREFIX:-sync/upstream}"

usage() {
  cat <<EOF
Usage:
  scripts/sync-upstream.sh setup
  scripts/sync-upstream.sh status
  scripts/sync-upstream.sh sync [branch-name]

Commands:
  setup   Ensure the ${UPSTREAM_REMOTE} remote exists and fetch it.
  status  Show local/main vs origin/main vs upstream/main status.
  sync    Create a sync branch from ${LOCAL_MAIN_BRANCH}, then merge origin and upstream changes into it.

Environment overrides:
  SYNC_UPSTREAM_REMOTE   Default: ${UPSTREAM_REMOTE}
  SYNC_ORIGIN_REMOTE     Default: ${ORIGIN_REMOTE}
  SYNC_UPSTREAM_URL      Default: ${UPSTREAM_URL}
  SYNC_MAIN_BRANCH       Default: ${LOCAL_MAIN_BRANCH}
  SYNC_UPSTREAM_BRANCH   Default: ${UPSTREAM_BRANCH}
  SYNC_BRANCH_PREFIX     Default: ${SYNC_BRANCH_PREFIX}
EOF
}

info() {
  printf '[sync-upstream] %s\n' "$*"
}

die() {
  printf '[sync-upstream] %s\n' "$*" >&2
  exit 1
}

ensure_git_repo() {
  git rev-parse --show-toplevel >/dev/null 2>&1 || die "Current directory is not a git repository."
}

remote_exists() {
  git remote get-url "$1" >/dev/null 2>&1
}

ensure_upstream_remote() {
  if remote_exists "${UPSTREAM_REMOTE}"; then
    local current_url
    current_url="$(git remote get-url "${UPSTREAM_REMOTE}")"
    if [[ "${current_url}" != "${UPSTREAM_URL}" ]]; then
      die "Remote ${UPSTREAM_REMOTE} already exists but points to ${current_url}. Expected ${UPSTREAM_URL}."
    fi
    info "Remote ${UPSTREAM_REMOTE} already configured: ${current_url}"
    return
  fi

  git remote add "${UPSTREAM_REMOTE}" "${UPSTREAM_URL}"
  info "Added remote ${UPSTREAM_REMOTE} -> ${UPSTREAM_URL}"
}

fetch_remote_if_exists() {
  local remote="$1"
  if remote_exists "${remote}"; then
    git fetch "${remote}" --tags
    return
  fi

  if [[ "${remote}" == "${ORIGIN_REMOTE}" ]]; then
    die "Remote ${remote} does not exist."
  fi
}

ensure_clean_worktree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    die "Working tree is not clean. Commit or stash your changes first."
  fi
}

ensure_local_branch_exists() {
  local branch="$1"
  git show-ref --verify --quiet "refs/heads/${branch}" || die "Local branch ${branch} does not exist."
}

has_remote_branch() {
  local remote="$1"
  local branch="$2"
  git show-ref --verify --quiet "refs/remotes/${remote}/${branch}"
}

print_divergence() {
  local left="$1"
  local right="$2"
  if ! git rev-parse --verify "${left}" >/dev/null 2>&1; then
    printf 'missing    '
    return
  fi
  if ! git rev-parse --verify "${right}" >/dev/null 2>&1; then
    printf 'missing    '
    return
  fi

  local counts ahead behind
  counts="$(git rev-list --left-right --count "${left}...${right}")"
  ahead="${counts%%[[:space:]]*}"
  behind="${counts##*[[:space:]]}"
  printf 'ahead=%s behind=%s' "${ahead}" "${behind}"
}

merge_remote_branch() {
  local remote="$1"
  local branch="$2"
  local ref="${remote}/${branch}"

  if ! has_remote_branch "${remote}" "${branch}"; then
    info "Skipping ${ref}: remote branch not found."
    return
  fi

  if git merge-base --is-ancestor "${ref}" HEAD; then
    info "${ref} is already contained in $(git branch --show-current)."
    return
  fi

  info "Merging ${ref} into $(git branch --show-current)..."
  if git merge --no-edit "${ref}"; then
    info "Merged ${ref}."
    return
  fi

  cat <<EOF >&2
[sync-upstream] Merge conflict while merging ${ref}.
[sync-upstream] Resolve conflicts on the current branch, then continue with:
  git add <resolved-files>
  git commit
EOF
  exit 1
}

cmd_setup() {
  ensure_upstream_remote
  fetch_remote_if_exists "${UPSTREAM_REMOTE}"
  info "Upstream remote is ready."
}

cmd_status() {
  ensure_upstream_remote
  fetch_remote_if_exists "${ORIGIN_REMOTE}"
  fetch_remote_if_exists "${UPSTREAM_REMOTE}"
  ensure_local_branch_exists "${LOCAL_MAIN_BRANCH}"

  printf 'current_branch: %s\n' "$(git branch --show-current)"
  printf '%s_url: %s\n' "${ORIGIN_REMOTE}" "$(git remote get-url "${ORIGIN_REMOTE}")"
  printf '%s_url: %s\n' "${UPSTREAM_REMOTE}" "$(git remote get-url "${UPSTREAM_REMOTE}")"
  printf '%s_vs_%s/%s: %s\n' \
    "${LOCAL_MAIN_BRANCH}" "${ORIGIN_REMOTE}" "${LOCAL_MAIN_BRANCH}" \
    "$(print_divergence "${LOCAL_MAIN_BRANCH}" "${ORIGIN_REMOTE}/${LOCAL_MAIN_BRANCH}")"
  printf '%s_vs_%s/%s: %s\n' \
    "${LOCAL_MAIN_BRANCH}" "${UPSTREAM_REMOTE}" "${UPSTREAM_BRANCH}" \
    "$(print_divergence "${LOCAL_MAIN_BRANCH}" "${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}")"
}

cmd_sync() {
  local branch_name="${1:-${SYNC_BRANCH_PREFIX}-$(date +%Y%m%d-%H%M%S)}"

  ensure_upstream_remote
  ensure_clean_worktree
  ensure_local_branch_exists "${LOCAL_MAIN_BRANCH}"
  fetch_remote_if_exists "${ORIGIN_REMOTE}"
  fetch_remote_if_exists "${UPSTREAM_REMOTE}"

  git show-ref --verify --quiet "refs/heads/${branch_name}" &&
    die "Branch ${branch_name} already exists."

  git switch -c "${branch_name}" "${LOCAL_MAIN_BRANCH}"
  merge_remote_branch "${ORIGIN_REMOTE}" "${LOCAL_MAIN_BRANCH}"
  merge_remote_branch "${UPSTREAM_REMOTE}" "${UPSTREAM_BRANCH}"

  cat <<EOF
[sync-upstream] Sync branch ready: ${branch_name}
[sync-upstream] Next steps:
  1. Resolve conflicts if there are any.
  2. Run verification, for example:
     pnpm run lint
     pnpm run typecheck
     pnpm run build
  3. Merge ${branch_name} back into ${LOCAL_MAIN_BRANCH} after verification.
EOF
}

main() {
  ensure_git_repo

  local command="${1:-}"
  case "${command}" in
    setup)
      shift
      cmd_setup "$@"
      ;;
    status)
      shift
      cmd_status "$@"
      ;;
    sync)
      shift
      cmd_sync "$@"
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      die "Unknown command: ${command}"
      ;;
  esac
}

main "$@"
