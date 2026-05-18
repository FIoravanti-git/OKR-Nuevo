#!/usr/bin/env bash
# Igual que deploy.sh pero con build sin caché (recomendado en VPS tras git push).
export NO_CACHE=1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/deploy.sh" "$@"
