#!/usr/bin/env bash
# Despliegue en VPS: actualiza el repo, construye la imagen Docker, aplica migraciones y levanta el stack.
#
# Uso:
#   ./deploy.sh
#   GIT_BRANCH=main ./deploy.sh
#   SKIP_MIGRATE=1 ./deploy.sh          # solo build + up (sin prisma migrate deploy)
#   NO_CACHE=1 ./deploy.sh              # docker build sin caché (más lento, build limpio)
#
# Requisitos: git, docker con plugin "compose", archivo .env en la raíz (DATABASE_URL, AUTH_SECRET, etc.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"
NO_CACHE="${NO_CACHE:-0}"

if docker compose version &>/dev/null; then
  DC=(docker compose)
elif command -v docker-compose &>/dev/null; then
  DC=(docker-compose)
else
  echo "Error: no se encontró 'docker compose' ni 'docker-compose'." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Error: falta .env en ${SCRIPT_DIR} (docker-compose lo requiere)." >&2
  exit 1
fi

echo "==> Repo: ${SCRIPT_DIR}"
echo "==> Rama: ${BRANCH} · remoto: ${REMOTE}"

if [[ "${BRANCH}" == "HEAD" ]]; then
  echo "Error: estás en detached HEAD; definí GIT_BRANCH (ej: GIT_BRANCH=main ./deploy.sh)." >&2
  exit 1
fi

echo "==> Git fetch + pull (${REMOTE}/${BRANCH})"
git fetch "${REMOTE}" "${BRANCH}"
git pull "${REMOTE}" "${BRANCH}"

BUILD_ARGS=()
if [[ "${NO_CACHE}" == "1" ]]; then
  BUILD_ARGS+=(--no-cache)
fi

echo "==> Docker build"
"${DC[@]}" build "${BUILD_ARGS[@]}"

if [[ "${SKIP_MIGRATE}" != "1" ]]; then
  echo "==> Prisma migrate deploy (contenedor efímero)"
  "${DC[@]}" run --rm okr-stack npx prisma migrate deploy
else
  echo "==> Omitiendo migraciones (SKIP_MIGRATE=1)"
fi

echo "==> Levantando / recargando servicios"
"${DC[@]}" up -d --remove-orphans

echo "==> Estado"
"${DC[@]}" ps

if [[ -x scripts/verify-public-routes.sh ]]; then
  echo "==> Verificación HTTP"
  sleep 2
  scripts/verify-public-routes.sh || true
fi

echo "==> Listo. App (host network): http://127.0.0.1:3040 (reverso proxy típico: Nginx)."
echo "    Si subiste cambios desde otra máquina, usá ./deploy-pull.sh en el VPS (git pull + rebuild)."
