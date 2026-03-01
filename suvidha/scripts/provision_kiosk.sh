#!/usr/bin/env bash
# This script provisions a kiosk device identity by generating an RSA keypair and printing registration hints.
set -euo pipefail

DEVICE_ID="${1:-kiosk-001}"
OUT_DIR="${2:-./kiosk-keys}"

mkdir -p "$OUT_DIR"

PRIV="$OUT_DIR/${DEVICE_ID}.private.pem"
PUB="$OUT_DIR/${DEVICE_ID}.public.pem"

if [ -f "$PRIV" ] || [ -f "$PUB" ]; then
  echo "Key files already exist for ${DEVICE_ID} in ${OUT_DIR}."
  echo "Refusing to overwrite. Delete them if you want to re-provision."
  exit 1
fi

echo "Generating RSA keypair for ${DEVICE_ID}..."
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$PRIV"
openssl rsa -in "$PRIV" -pubout -out "$PUB" >/dev/null 2>&1

echo ""
echo "Generated:"
echo "  Private: $PRIV"
echo "  Public : $PUB"
echo ""
echo "Next (Phase 1): register the public key with the server:"
echo "  DEVICE_ID=${DEVICE_ID}"
echo "  cat \"$PUB\" | base64 -w 0"
echo ""
echo "Suggested curl (placeholder endpoint):"
echo "  curl -X POST http://localhost/sync/offline \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"device_id\":\"${DEVICE_ID}\",\"events\":[]}'"

