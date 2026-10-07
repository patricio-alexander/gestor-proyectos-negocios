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
#   SKIP_PULL=1 npm run deploy      # no hace git fetch/pull (ya bajaste cambios)
#   SKIP_PM2=1 npm run deploy       # no reinicia PM2 (el hub hace pm2 restart all al final)
#   RUN_SEED=1 npm run deploy       # corre seed (NO recomendado en prod: reescribe planes/subs/entitlement)
#   FORCE_SYNC=1 npm run deploy     # si pull --ff-only falla: reset --hard a origin (pierde cambios locales del server)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PM2_APP="${PM2_APP:-Raptor Solutions}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

echo "==> Carpeta: $ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: no es un repositorio git."
  exit 1
fi

if [[ "${SKIP_PULL:-0}" == "1" ]]; then
  echo "==> git pull (omitido: SKIP_PULL=1)"
else
  echo "==> git fetch + pull ($BRANCH)"
  git fetch origin "$BRANCH"

  if git pull --ff-only origin "$BRANCH"; then
    :
  else
    echo ""
    echo "ERROR: no se puede fast-forward. El servidor y origin/$BRANCH divergieron"
    echo "(alguien editó/commiteó en el server, o el historial remoto cambió)."
    echo ""
    echo "Para alinear el server con GitHub (borra cambios locales del server):"
    echo "  FORCE_SYNC=1 npm run deploy"
    echo "o a mano:"
    echo "  git fetch origin && git reset --hard origin/$BRANCH"
    echo ""
    if [[ "${FORCE_SYNC:-0}" == "1" ]]; then
      echo "==> FORCE_SYNC=1: git reset --hard origin/$BRANCH"
      git reset --hard "origin/$BRANCH"
    else
      exit 1
    fi
  fi
fi

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

# Por defecto NO seedeamos: migrate solo aplica SQL nuevo y no toca datos ya guardados.
# El seed completo reescribe planes, suscripciones, features y empuja entitlement a las apps.
if [[ "${RUN_SEED:-0}" == "1" ]]; then
  echo "==> npm run seed (opt-in: reescribe catálogo/planes/subs y empuja entitlement)"
  npm run seed
else
  echo "==> seed omitido (datos actuales intactos). Para forzar: RUN_SEED=1 npm run deploy"
fi

mkdir -p backups

# Turbopack/.next en dev puede crecer varios GB; build limpio evita cache corrupto o inflado.
echo "==> limpiando .next (cache de build)"
rm -rf .next tsconfig.tsbuildinfo

echo "==> next build"
npm run build

if [[ "${SKIP_PM2:-0}" == "1" ]]; then
  echo "==> pm2 (omitido: SKIP_PM2=1)"
elif command -v pm2 >/dev/null 2>&1; then
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
