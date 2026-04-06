#!/usr/bin/env bash
set -euo pipefail

# Deploy helper:
# - Muestra cambios de git
# - Hace commit y push
# - Rebuild y recreate con Docker Compose
#
# Uso:
#   ./deploy.sh "feat: mi mensaje de commit"
#   ./deploy.sh "feat: mi mensaje de commit" --no-cache
#   ./deploy.sh "feat: mi mensaje de commit" --skip-build-check
#   ./deploy.sh "feat: mi mensaje de commit" --branch main
#
# Requisitos:
# - Estar en repo git
# - Docker y docker compose disponibles

SERVICE_NAME="okr-stack"
BRANCH=""
NO_CACHE=false
SKIP_BUILD_CHECK=false

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 \"mensaje de commit\" [--no-cache] [--skip-build-check] [--branch <rama>]"
  exit 1
fi

COMMIT_MESSAGE="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cache)
      NO_CACHE=true
      shift
      ;;
    --skip-build-check)
      SKIP_BUILD_CHECK=true
      shift
      ;;
    --branch)
      BRANCH="${2:-}"
      if [[ -z "$BRANCH" ]]; then
        echo "Error: --branch requiere un valor."
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Opción no reconocida: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$BRANCH" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

echo "==> Rama actual: $BRANCH"
echo "==> Estado git:"
git status --short

if [[ "$SKIP_BUILD_CHECK" == "false" ]]; then
  echo "==> Validando build local (npm run build)..."
  npm run build
else
  echo "==> Saltando build local por --skip-build-check"
fi

echo "==> Agregando cambios a git..."
git add .

if git diff --cached --quiet; then
  echo "No hay cambios para commit. Se omite commit/push."
else
  echo "==> Commit..."
  git commit -m "$COMMIT_MESSAGE"
  echo "==> Push a origin/$BRANCH ..."
  git push origin "$BRANCH"
fi

echo "==> Deploy Docker Compose ($SERVICE_NAME)..."
if [[ "$NO_CACHE" == "true" ]]; then
  docker compose build --no-cache "$SERVICE_NAME"
else
  docker compose build "$SERVICE_NAME"
fi

docker compose up -d --force-recreate "$SERVICE_NAME"

echo "==> Últimos logs:"
docker compose logs --tail=120 "$SERVICE_NAME"

echo ""
echo "Deploy completado."
