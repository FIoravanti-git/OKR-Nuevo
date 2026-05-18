#!/usr/bin/env bash
# Deploy en VPS cuando el código nuevo está en GitHub (pull + rebuild Docker).
# Usar ESTE script si subís cambios desde tu PC y el deploy.sh del VPS solo hace commit local.
#
# Uso:
#   ./deploy-pull.sh
#   GIT_BRANCH=main ./deploy-pull.sh
#   NO_CACHE=1 ./deploy-pull.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
NO_CACHE="${NO_CACHE:-1}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"

if docker compose version &>/dev/null; then
  DC=(docker compose)
elif command -v docker-compose &>/dev/null; then
  DC=(docker-compose)
else
  echo "Error: no se encontró docker compose." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Error: falta .env en ${SCRIPT_DIR}" >&2
  exit 1
fi

echo "==> Rama: ${BRANCH}"
echo "==> Commit local ANTES del pull:"
git log -1 --oneline

echo "==> git fetch + pull (${REMOTE}/${BRANCH})"
git fetch "${REMOTE}" "${BRANCH}"
git pull --ff-only "${REMOTE}" "${BRANCH}"

echo "==> Commit local DESPUÉS del pull:"
git log -1 --oneline

echo "==> Verificando proxy (matcher solo rutas privadas):"
if grep -E '^\s*"/",\s*$' src/proxy.ts 2>/dev/null; then
  echo "FALLO: proxy.ts aún incluye \"/\" en matcher (versión antigua)."
  exit 1
fi
if ! grep -q '"/dashboard/:path*"' src/proxy.ts; then
  echo "FALLO: proxy.ts no tiene matcher de rutas privadas."
  exit 1
fi

BUILD_ARGS=()
if [[ "${NO_CACHE}" == "1" ]]; then
  BUILD_ARGS+=(--no-cache)
fi

echo "==> Docker build okr-stack"
"${DC[@]}" build "${BUILD_ARGS[@]}" okr-stack

if [[ "${SKIP_MIGRATE}" != "1" ]]; then
  echo "==> Prisma migrate deploy"
  "${DC[@]}" run --rm okr-stack npx prisma migrate deploy
fi

echo "==> Recrear contenedor"
"${DC[@]}" up -d --force-recreate okr-stack

echo "==> Estado"
"${DC[@]}" ps

if [[ -x scripts/verify-public-routes.sh ]]; then
  echo "==> Verificación HTTP"
  sleep 2
  scripts/verify-public-routes.sh
fi

echo "Deploy pull completado."
