#!/usr/bin/env bash
# Run on YOUR machine (Git Bash), from the major-guide folder:
#   bash deploy/pack.sh            -> deploy/out/code.tar.gz + deploy/out/data.tar.gz
#   bash deploy/pack.sh --code     -> only code.tar.gz (for later updates)
# Needs: deploy/.env.production (python deploy/make_env.py --ip <elastic-ip>)
#        local containers mongodb_major_guide, rabbitmq_major_guide, keycloak-major-guide-25.0.0, qdrant_major_guide
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="$(cd "$HERE/../.." && pwd)"      # folder that holds major-guide and major-guide-fe-main
OUT="$HERE/out"
mkdir -p "$OUT"

[ -f "$HERE/.env.production" ] || { echo "Missing deploy/.env.production - run: python deploy/make_env.py --ip <elastic-ip>"; exit 1; }
[ -d "$WORKSPACE/major-guide-fe-main" ] || { echo "Missing $WORKSPACE/major-guide-fe-main"; exit 1; }

echo "==> Packing source code"
cd "$WORKSPACE"
tar -czf "$OUT/code.tar.gz" \
  --exclude='node_modules' --exclude='.git' --exclude='.nx' --exclude='__pycache__' \
  --exclude='major-guide/dist' --exclude='major-guide/tmp' \
  --exclude='major-guide/docker/docker_data' \
  --exclude='major-guide/deploy/out' --exclude='major-guide/deploy/data' \
  --exclude='major-guide/agentic-ai/venv' --exclude='major-guide/agentic-ai/ml/data' \
  --exclude='major-guide-fe-main/build' --exclude='major-guide-fe-main/e2e/screenshots' \
  --exclude='major-guide-fe-main/e2e/reports' \
  --exclude='.env' --exclude='.env.local' --exclude='*.log' --exclude='~$*' --exclude='*.pem' \
  major-guide major-guide-fe-main
echo "    $(du -h "$OUT/code.tar.gz" | cut -f1)  $OUT/code.tar.gz"

[ "${1:-}" = "--code" ] && exit 0

echo "==> Exporting data (MongoDB dump, RabbitMQ definitions, Keycloak + Qdrant files)"
TMP="$(mktemp -d)"
docker exec mongodb_major_guide sh -c \
  'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --gzip --archive=/tmp/mongo.archive.gz --quiet'
docker cp mongodb_major_guide:/tmp/mongo.archive.gz "$TMP/mongo.archive.gz"
docker exec mongodb_major_guide rm -f /tmp/mongo.archive.gz

# Exchanges, queues, bindings, policies and vhosts (not the messages).
docker exec rabbitmq_major_guide sh -c 'rabbitmqctl export_definitions /tmp/rabbitmq-definitions.json >/dev/null'
docker cp rabbitmq_major_guide:/tmp/rabbitmq-definitions.json "$TMP/rabbitmq-definitions.json"
docker exec rabbitmq_major_guide rm -f /tmp/rabbitmq-definitions.json
grep -q '"queues"' "$TMP/rabbitmq-definitions.json" || { echo "RabbitMQ export failed"; exit 1; }

# Keycloak (H2 file) and Qdrant must be stopped for a consistent copy.
restart() { docker start keycloak-major-guide-25.0.0 qdrant_major_guide >/dev/null || true; }
trap restart EXIT
docker stop keycloak-major-guide-25.0.0 qdrant_major_guide >/dev/null
tar -czf "$OUT/data.tar.gz" \
  -C "$WORKSPACE/major-guide/docker/docker_data" keycloak_data qdrant_data \
  -C "$TMP" mongo.archive.gz rabbitmq-definitions.json
restart
trap - EXIT
rm -rf "$TMP"
echo "    $(du -h "$OUT/data.tar.gz" | cut -f1)  $OUT/data.tar.gz"
echo "==> Done. Upload with:"
echo "    scp -i <key.pem> deploy/out/code.tar.gz deploy/out/data.tar.gz ubuntu@<elastic-ip>:~/"
