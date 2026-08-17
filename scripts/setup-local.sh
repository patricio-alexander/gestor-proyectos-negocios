#!/usr/bin/env bash
# Configura el entorno local: catálogo + gestor + backends EdDeli/Store/Tienda.
#
# Uso (desde la raíz del gestor):
#   npm run setup
#
# Opciones:
#   IMPORT_GESTOR=1   importa backups/backup.json en lugar del seed del gestor
#   SKIP_APPS=1       solo gestor (no toca eddeli/store/tienda)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPSWEB="$(cd "$ROOT/.." && pwd)"

run_backend() {
  local app="$1"
  shift
  local dir="$APPSWEB/$app/backend"
  if [[ ! -d "$dir" ]]; then
    echo "Aviso: no existe $dir — omitiendo $app"
    return 0
  fi
  echo ""
  echo "==> Backend $app ($dir)"
  (cd "$dir" && "$@")
}

echo "==> Setup local Raptor Solutions"
echo "    Gestor: $ROOT"
echo "    AppsWeb: $APPSWEB"

echo ""
echo "==> 1/4 Regenerar catálogo (raptor → eddeli-product-catalog.ts)"
node "$ROOT/scripts/generate-eddeli-catalog.mjs"

echo ""
echo "==> 2/4 Gestor (Prisma migrate + datos)"
cd "$ROOT"
if [[ "${IMPORT_GESTOR:-0}" == "1" && -f "$ROOT/backups/backup.json" ]]; then
  echo "    IMPORT_GESTOR=1 → importando backups/backup.json"
  npx tsx "$ROOT/scripts/import-gestor-backup.ts" "$ROOT/backups/backup.json"
  npm run db:sync-catalog
else
  npm run db:sync
fi

if [[ "${SKIP_APPS:-0}" == "1" ]]; then
  echo ""
  echo "==> SKIP_APPS=1 — backends omitidos"
  echo "Listo: gestor configurado."
  exit 0
fi

echo ""
echo "==> 3/4 EdDeli backend"
if [[ -f "$APPSWEB/eddeli/backend/src/database/backup.json" ]]; then
  echo "    backup.json encontrado → db:reset (carga datos locales)"
  run_backend eddeli npm run db:reset
else
  echo "    Sin backup.json → solo esquema (db:sync)"
  run_backend eddeli npm run db:sync
fi

echo ""
echo "==> 4/4 Store y Tienda (esquema + seed mínimo)"
run_backend store bash -c 'npm run db:sync && npm run seed'
run_backend tienda bash -c 'npm run db:sync && npm run seed'

echo ""
echo "Listo: catálogo, gestor y backends sincronizados."
echo "Tip: poné backups/backup.json y usá IMPORT_GESTOR=1 npm run setup para restaurar el gestor."
