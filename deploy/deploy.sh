#!/usr/bin/env bash
# Run on the EC2 server from the home folder:  bash majorguide/major-guide/deploy/deploy.sh
# - unpacks ~/code.tar.gz (if uploaded), first time also restores ~/data.tar.gz
# - builds the images one by one (fits in 8 GB RAM), starts everything, warms the RAG model
# Safe to run again after uploading a new code.tar.gz: data is kept.
set -euo pipefail
# Wrapped in { } so bash reads the whole file first: unpacking code.tar.gz overwrites this script.
{

BASE="$HOME/majorguide"
if [ -f "$HOME/code.tar.gz" ]; then
  echo "==> Unpacking code"
  mkdir -p "$BASE"
  tar -xzf "$HOME/code.tar.gz" -C "$BASE"
  rm -f "$HOME/code.tar.gz"
fi
cd "$BASE/major-guide/deploy"

ENV_FILE=.env.production
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (create it with make_env.py before pack.sh)"; exit 1; }
PRIVATE_IP="$(hostname -I | awk '{print $1}')"
sed -i "s/^PRIVATE_IP=.*/PRIVATE_IP=$PRIVATE_IP/" "$ENV_FILE"
DOMAIN="$(grep '^DOMAIN=' "$ENV_FILE" | cut -d= -f2)"
DC="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"

RESTORE_MONGO=0
if [ -f "$HOME/data.tar.gz" ] && [ ! -d data/keycloak ]; then
  echo "==> Restoring Keycloak + Qdrant data"
  mkdir -p data/restore
  tar -xzf "$HOME/data.tar.gz" -C data/restore
  mv data/restore/keycloak_data data/keycloak
  mv data/restore/qdrant_data data/qdrant
  sudo chown -R 1000:1000 data/keycloak          # keycloak runs as uid 1000
  RESTORE_MONGO=1
fi
mkdir -p data/restore

echo "==> Building images (10-20 minutes the first time)"
$DC build bff
$DC build agentic-ai
$DC build caddy

echo "==> Starting MongoDB"
$DC up -d mongodb
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mongodb)")" = "healthy" ]; do sleep 3; done

if [ "$RESTORE_MONGO" = 1 ]; then
  echo "==> Restoring MongoDB dump"
  $DC exec -T mongodb sh -c 'mongorestore -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin --gzip --archive=/restore/mongo.archive.gz --drop \
    --nsExclude "admin.*" --nsExclude "config.*" --nsExclude "local.*" --quiet'
  rm -f data/restore/mongo.archive.gz "$HOME/data.tar.gz"
fi

if [ -f data/restore/rabbitmq-definitions.json ]; then
  echo "==> Restoring RabbitMQ exchanges, queues and bindings"
  # Local users (guest) are dropped: the server keeps its own RABBITMQ_USER from .env.production.
  python3 - data/restore/rabbitmq-definitions.json <<'PY'
import json, sys
path = sys.argv[1]
defs = json.load(open(path))
for key in ("users", "permissions", "topic_permissions"):
    defs.pop(key, None)
json.dump(defs, open(path, "w"))
PY
  $DC up -d rabbitmq
  until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q rabbitmq)")" = "healthy" ]; do sleep 3; done
  $DC cp data/restore/rabbitmq-definitions.json rabbitmq:/tmp/rabbitmq-definitions.json
  $DC exec -T rabbitmq rabbitmqctl import_definitions /tmp/rabbitmq-definitions.json
  $DC exec -T rabbitmq rm -f /tmp/rabbitmq-definitions.json
  $DC exec -T rabbitmq rabbitmqctl list_exchanges name type durable | grep -v '^amq\.'
  $DC exec -T rabbitmq rabbitmqctl list_queues name durable arguments
  $DC exec -T rabbitmq rabbitmqctl list_bindings source_name destination_name routing_key
  rm -f data/restore/rabbitmq-definitions.json
fi

echo "==> Starting all services"
$DC up -d --remove-orphans

echo "==> Repairing timestamps saved with the service start-up time (old bug, idempotent)"
$DC exec -T mongodb sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "$0"'   "$(cat fix-timestamps.js)" || echo "   (timestamp repair failed)"

echo "==> Demo booking for video-call testing (nguyenhuy <-> kimwexler, always open)"
$DC exec -T mongodb sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "$0"' \
  "$(cat seed-demo-booking.js)" || echo "   (demo booking not created)"

echo "==> Downloading the RAG embedding model (bge-m3, ~2.3 GB, first time only)"
$DC exec -T agentic-ai python -c "from sentence_transformers import SentenceTransformer as S; S('BAAI/bge-m3')" \
  || echo "   (model download failed - it will be retried on the first chat question)"

$DC ps --format 'table {{.Service}}\t{{.Status}}'
free -h | head -2
echo
echo "MajorGuide: https://$DOMAIN"
echo "Logs:       cd $BASE/major-guide/deploy && $DC logs -f bff"
exit 0
}
