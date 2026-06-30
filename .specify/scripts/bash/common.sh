#!/usr/bin/env bash
# Helpers compartidos por los scripts de Spec-Kit.
set -euo pipefail

repo_root() {
  git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null \
    || (cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
}

slugify() {
  local s="$1"
  printf '%s' "$s" \
    | tr '[:upper:]' '[:lower:]' \
    | iconv -f utf-8 -t ascii//translit 2>/dev/null \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

next_feature_number() {
  local dir="$1"
  local last
  last=$(find "$dir" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null \
    | grep -E '^[0-9]{3}-' | sed -E 's/^([0-9]{3})-.*/\1/' | sort -n | tail -1)
  if [[ -z "${last:-}" ]]; then
    printf '001'
  else
    printf '%03d' $((10#$last + 1))
  fi
}
