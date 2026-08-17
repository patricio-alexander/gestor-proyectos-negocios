#!/usr/bin/env bash
# Sube cambios del gestor a Git (add + commit + push).
#
# Uso (desde la raíz del proyecto):
#   npm run git:push -- "mensaje del commit"
#   ./scripts/git-push.sh "mensaje del commit"
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MSG="${*:-}"
if [[ -z "$MSG" ]]; then
  MSG="chore(gestor): update $(date -u +'%Y-%m-%d %H:%M UTC')"
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: no es un repositorio git."
  exit 1
fi

echo "==> Estado"
git status -sb

# No hay nada que subir
if [[ -z "$(git status --porcelain)" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  echo "==> Sin cambios locales. Empujando $BRANCH por si falta push…"
  git push -u origin HEAD
  echo "Listo."
  exit 0
fi

echo "==> git add"
git add -A

# Evitar subir secretos / dumps de BD
BLOCKED="$(git diff --cached --name-only | grep -E '(^|/)\.env($|\.)|backup.*\.json$|\.backup\.json$|backup-eddeli-servidor\.json$|backup-tienda\.json$|backup-gestor-.*\.json$' | grep -v 'backup\.json\.example$' || true)"
if [[ -n "$BLOCKED" ]]; then
  echo "Error: hay archivos sensibles en el staging (.env o backups JSON):"
  echo "$BLOCKED"
  git restore --staged $BLOCKED
  exit 1
fi

echo "==> commit: $MSG"
git commit -m "$MSG"

echo "==> push"
git push -u origin HEAD

echo "Listo: cambios subidos a Git."
