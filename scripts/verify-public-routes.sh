#!/usr/bin/env bash
# Verifica rutas públicas vs protegidas (ejecutar en el VPS tras deploy).
set -euo pipefail

BASE="${1:-http://127.0.0.1:3040}"

echo "==> GET $BASE/"
ROOT_HEADERS="$(curl -sI "$BASE/")"
echo "$ROOT_HEADERS" | head -12
if echo "$ROOT_HEADERS" | grep -qi "^location:.*login"; then
  echo "FALLO: / redirige a /login"
  exit 1
fi
if ! echo "$ROOT_HEADERS" | grep -q "200"; then
  echo "FALLO: / no devolvió 200"
  exit 1
fi

BODY="$(curl -s "$BASE/")"
if ! echo "$BODY" | grep -q "OKR Stack"; then
  echo "FALLO: HTML de / no contiene OKR Stack"
  exit 1
fi

echo "==> GET $BASE/login"
LOGIN_HEADERS="$(curl -sI "$BASE/login")"
echo "$LOGIN_HEADERS" | head -8
if ! echo "$LOGIN_HEADERS" | grep -q "200"; then
  echo "FALLO: /login no devolvió 200"
  exit 1
fi

echo "==> GET $BASE/dashboard (sin cookie)"
DASH_HEADERS="$(curl -sI "$BASE/dashboard")"
echo "$DASH_HEADERS" | head -8
if ! echo "$DASH_HEADERS" | grep -qi "location:.*login"; then
  echo "FALLO: /dashboard debería redirigir a login"
  exit 1
fi

echo "OK: rutas públicas y protegidas se comportan como se espera."
