#!/usr/bin/env bash
# Despliega el gestor en el servidor: pull + deps + prisma + build + PM2.
#
# Uso (en el SERVIDOR, desde la raíz del proyecto):
#   npm run deploy
#   ./scripts/deploy.sh
#
# Opciones:
#   SKIP_MIGRATE=1 npm run deploy   # no corre prisma migrate deploy
#   SKIP_INSTALL=1 npm run deploy   # no corre npm install
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PM2_APP="${PM2_APP:-Raptor Solutions}"

echo "==> Carpeta: $ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: no es un repositorio git."
  exit 1
fi

echo "==> git pull"
git pull --ff-only

if [[ "${SKIP_INSTALL:-0}" != "1" ]]; then
  echo "==> npm install"
  npm install
else
  echo "==> npm install (omitido)"
fi

echo "==> prisma generate"
npx prisma generate

if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
  echo "==> prisma migrate deploy"
  npx prisma migrate deploy
else
  echo "==> prisma migrate (omitido)"
fi

echo "==> next build"
npm run build

if command -v pm2 >/dev/null 2>&1; then
  echo "==> pm2 restart \"$PM2_APP\""
  if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP"
  else
    echo "PM2 no tiene la app \"$PM2_APP\". Levantando ecosystem…"
    pm2 start ecosystem.config.cjs
  fi
  pm2 save || true
else
  echo "Aviso: pm2 no está instalado. Build listo; arrancá con: npm run start"
fi

echo "Listo: gestor desplegado."
