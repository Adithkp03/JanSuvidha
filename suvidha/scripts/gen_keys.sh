#!/usr/bin/env bash
# This script generates an RSA keypair suitable for JWT signing and prints .env-style variables.
set -euo pipefail

OUT_DIR="${1:-./keys}"
mkdir -p "$OUT_DIR"

PRIV="$OUT_DIR/jwt_private.pem"
PUB="$OUT_DIR/jwt_public.pem"

if [ -f "$PRIV" ] || [ -f "$PUB" ]; then
  echo "Key files already exist in ${OUT_DIR}."
  echo "Refusing to overwrite. Delete them if you want to regenerate."
  exit 1
fi

echo "Generating JWT RSA keypair..."
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$PRIV"
openssl rsa -in "$PRIV" -pubout -out "$PUB" >/dev/null 2>&1

echo ""
echo "Generated:"
echo "  Private: $PRIV"
echo "  Public : $PUB"
echo ""
echo "Paste into infra/.env (single line, keep BEGIN/END markers):"
echo "----------------------------------------------------------------"
echo "JWT_PRIVATE_KEY=\"$(tr -d '\n' < "$PRIV")\""
echo "JWT_PUBLIC_KEY=\"$(tr -d '\n' < "$PUB")\""
echo "----------------------------------------------------------------"

