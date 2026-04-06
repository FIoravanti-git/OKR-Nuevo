#!/usr/bin/env bash
set -euo pipefail

# Deploy helper:
# - Muestra cambios de git
# - Hace commit y push
# - Rebuild y recreate con Docker Compose
# - Maneja docker compose plugin o docker-compose clásico
# - Reintenta si aparece el error 'ContainerConfig' de compose v1
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
COMPOSE_CMD=""

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

detect_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
    return 0
  fi
  echo "Error: no se encontró 'docker compose' ni 'docker-compose'."
  exit 1
}

compose() {
  if [[ "$COMPOSE_CMD" == "docker compose" ]]; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

cleanup_stale_service_containers() {
  echo "==> Limpiando contenedores residuales de $SERVICE_NAME ..."
  # Borra nombres tipo "<id>_okr-stack" y "okr-stack" si quedaron huérfanos.
  while IFS= read -r line; do
    cname="${line#* }"
    if [[ -n "$cname" ]]; then
      docker rm -f "$cname" >/dev/null 2>&1 || true
    fi
  done < <(docker ps -a --format '{{.ID}} {{.Names}}' | awk -v s="$SERVICE_NAME" '$2==s || $2 ~ ("_" s "$")')
}

if [[ -z "$BRANCH" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

detect_compose_cmd

echo "==> Rama actual: $BRANCH"
echo "==> Compose detectado: $COMPOSE_CMD"
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
  compose build --no-cache "$SERVICE_NAME"
else
  compose build "$SERVICE_NAME"
fi

set +e
UP_OUTPUT="$(compose up -d --force-recreate "$SERVICE_NAME" 2>&1)"
UP_EXIT=$?
set -e

if [[ $UP_EXIT -ne 0 ]]; then
  if [[ "$UP_OUTPUT" == *"ContainerConfig"* ]]; then
    echo "$UP_OUTPUT"
    echo "==> Detectado error ContainerConfig. Reintentando con limpieza segura..."
    cleanup_stale_service_containers
    compose up -d "$SERVICE_NAME"
  else
    echo "$UP_OUTPUT"
    echo "Error: falló 'compose up'."
    exit $UP_EXIT
  fi
fi

echo "==> Estado del servicio:"
compose ps
echo "==> Últimos logs:"
compose logs --tail=120 "$SERVICE_NAME"

echo ""
echo "Deploy completado."
