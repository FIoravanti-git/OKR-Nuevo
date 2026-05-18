#!/usr/bin/env bash
# Despliegue en VPS: baja cambios de Git, construye Docker, aplica migraciones y levanta el stack.
#
# Uso:
#   ./deploy.sh
#   GIT_BRANCH=main ./deploy.sh
#   NO_CACHE=1 ./deploy.sh              # build sin caché (recomendado tras cambios grandes de frontend)
#   SKIP_MIGRATE=1 ./deploy.sh          # omitir prisma migrate deploy
#   SKIP_VERIFY=1 ./deploy.sh           # omitir curl de rutas públicas
#   RUN_SEED_LANDING=1 ./deploy.sh      # tras migrar, poblar landing si no existe (idempotente)
#
# Requisitos: git, docker compose, .env (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, etc.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"
SKIP_VERIFY="${SKIP_VERIFY:-0}"
SKIP_PROXY_CHECK="${SKIP_PROXY_CHECK:-0}"
NO_CACHE="${NO_CACHE:-0}"
RUN_SEED_LANDING="${RUN_SEED_LANDING:-0}"
SERVICE="${COMPOSE_SERVICE:-okr-stack}"

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

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Aviso: hay cambios locales sin commitear. El pull puede fallar o mezclar estado." >&2
  git status -s
fi

echo "==> Commit ANTES del pull:"
git log -1 --oneline || true

echo "==> Git fetch + pull (${REMOTE}/${BRANCH})"
git fetch "${REMOTE}" "${BRANCH}"
if ! git pull --ff-only "${REMOTE}" "${BRANCH}"; then
  echo "Error: git pull --ff-only falló (rama divergente o cambios locales)." >&2
  echo "       Revisá con: git status && git log --oneline -3 ${REMOTE}/${BRANCH}" >&2
  echo "       En el VPS, si solo querés lo remoto: git reset --hard ${REMOTE}/${BRANCH}" >&2
  exit 1
fi

echo "==> Commit DESPUÉS del pull:"
git log -1 --oneline

if [[ "${SKIP_PROXY_CHECK}" != "1" ]] && [[ -f src/proxy.ts ]]; then
  echo "==> Comprobando proxy (rutas públicas fuera del matcher)"
  if grep -E '^\s*"/",\s*$' src/proxy.ts 2>/dev/null; then
    echo "Error: proxy.ts incluye \"/\" en matcher (versión antigua que redirige a login)." >&2
    exit 1
  fi
  # -F: el asterisco en :path* es literal (sin -F grep lo trata como cuantificador regex)
  if ! grep -Fq '"/dashboard/:path*"' src/proxy.ts; then
    echo "Error: proxy.ts no tiene matcher de rutas privadas esperado." >&2
    exit 1
  fi
fi

BUILD_ARGS=()
if [[ "${NO_CACHE}" == "1" ]]; then
  BUILD_ARGS+=(--no-cache)
  echo "==> Docker build (sin caché)"
else
  echo "==> Docker build"
fi
"${DC[@]}" build "${BUILD_ARGS[@]}" "${SERVICE}"

if [[ "${SKIP_MIGRATE}" != "1" ]]; then
  echo "==> Prisma migrate deploy"
  "${DC[@]}" run --rm "${SERVICE}" npx prisma migrate deploy

  if [[ "${RUN_SEED_LANDING}" == "1" ]]; then
    echo "==> Seed landing (idempotente, solo si no existe fila default)"
    "${DC[@]}" run --rm "${SERVICE}" npm run db:seed-landing || true
  fi
else
  echo "==> Omitiendo migraciones (SKIP_MIGRATE=1)"
fi

echo "==> Recrear contenedor con imagen nueva"
"${DC[@]}" up -d --force-recreate --remove-orphans "${SERVICE}"

echo "==> Estado"
"${DC[@]}" ps

if [[ "${SKIP_VERIFY}" != "1" ]] && [[ -x scripts/verify-public-routes.sh ]]; then
  echo "==> Verificación HTTP (/, /login, /dashboard)"
  sleep 3
  scripts/verify-public-routes.sh
fi

echo "==> Deploy completado."
echo "    App: http://127.0.0.1:3040 (host network; Nginx/proxy delante si aplica)."
