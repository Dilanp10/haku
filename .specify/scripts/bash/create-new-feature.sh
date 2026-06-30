#!/usr/bin/env bash
# Crea un nuevo feature folder en specs/NNN-<slug>/ a partir de los templates.
# Uso:  ./create-new-feature.sh "Nombre de la feature"
set -euo pipefail

HERE="$(dirname "${BASH_SOURCE[0]}")"
# shellcheck source=common.sh
source "$HERE/common.sh"

if [[ $# -lt 1 ]]; then
  echo "Uso: $(basename "$0") \"Nombre de la feature\"" >&2
  exit 1
fi

NAME="$1"
ROOT="$(repo_root)"
SPECS="$ROOT/specs"
mkdir -p "$SPECS"

NUM=$(next_feature_number "$SPECS")
SLUG=$(slugify "$NAME")
DIR="$SPECS/$NUM-$SLUG"

if [[ -d "$DIR" ]]; then
  echo "Ya existe: $DIR" >&2
  exit 1
fi

mkdir -p "$DIR/checklists" "$DIR/contracts"

render() {
  local tpl="$1" dest="$2"
  sed "s/{{FEATURE_NAME}}/${NAME//\//\\/}/g" "$tpl" > "$dest"
}

render "$ROOT/.specify/templates/spec-template.md"      "$DIR/spec.md"
render "$ROOT/.specify/templates/plan-template.md"      "$DIR/plan.md"
render "$ROOT/.specify/templates/tasks-template.md"     "$DIR/tasks.md"
render "$ROOT/.specify/templates/checklist-template.md" "$DIR/checklists/acceptance.md"

cat > "$DIR/quickstart.md" <<EOF
# Quickstart — $NAME

Pasos mínimos para validar la feature en local.

\`\`\`bash
supabase start && pnpm db:reset
pnpm dev
\`\`\`

(Completar con los pasos concretos al implementar.)
EOF

echo "✓ $DIR"
