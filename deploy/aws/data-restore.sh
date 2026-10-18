#!/usr/bin/env bash
# Chạy trên EC2 data, trong thư mục ~/majorguide (README bước 4 nói file nào cần upload):
#   bash data-restore.sh
# Lần đầu (có data.tar.gz, chưa có data/keycloak): nạp MongoDB, RabbitMQ (exchange/queue/binding),
# Keycloak, Qdrant từ máy local rồi bật tất cả. Các lần sau: chỉ bật lại container, data giữ nguyên.
set -euo pipefail
# Bọc trong { } để bash đọc hết file trước khi chạy.
{

cd "$(dirname "$0")"
ENV_FILE=.env.production
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE"; exit 1; }
DC="docker compose --env-file $ENV_FILE -f docker-compose.data.yml"

# coturn cần IP public (Elastic IP) và IP private; cả hai không đổi khi Stop/Start máy.
TOKEN="$(curl -sX PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')"
metadata() { curl -s -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/$1"; }
PUBLIC_IP="$(metadata public-ipv4)"
PRIVATE_IP="$(metadata local-ipv4)"
sed -i "s/^PUBLIC_IP=.*/PUBLIC_IP=$PUBLIC_IP/; s/^PRIVATE_IP=.*/PRIVATE_IP=$PRIVATE_IP/" "$ENV_FILE"

RESTORE=0
if [ -f data.tar.gz ] && [ ! -d data/keycloak ]; then
  echo "==> Giải nén data.tar.gz"
  mkdir -p data/restore
  tar -xzf data.tar.gz -C data/restore
  mv data/restore/keycloak_data data/keycloak
  mv data/restore/qdrant_data data/qdrant
  RESTORE=1
elif [ ! -d data/keycloak ]; then
  echo "!! Không thấy data.tar.gz: chạy với database trống"
  mkdir -p data/keycloak data/qdrant
fi
mkdir -p data/restore
sudo chown -R 1000:1000 data/keycloak          # keycloak chạy với uid 1000

wait_healthy() {
  until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q "$1")")" = "healthy" ]; do sleep 3; done
}

echo "==> Bật MongoDB + RabbitMQ"
$DC up -d mongodb rabbitmq
wait_healthy mongodb
wait_healthy rabbitmq

if [ "$RESTORE" = 1 ]; then
  echo "==> Nạp MongoDB"
  $DC exec -T mongodb sh -c 'mongorestore -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin --gzip --archive=/restore/mongo.archive.gz --drop \
    --nsExclude "admin.*" --nsExclude "config.*" --nsExclude "local.*" --quiet'
  rm -f data/restore/mongo.archive.gz
fi

if [ -f data/restore/rabbitmq-definitions.json ]; then
  echo "==> Nạp RabbitMQ exchanges, queues, bindings"
  # Bỏ user guest của local: server dùng RABBITMQ_USER trong .env.production.
  python3 - data/restore/rabbitmq-definitions.json <<'PY'
import json, sys
path = sys.argv[1]
defs = json.load(open(path))
for key in ("users", "permissions", "topic_permissions"):
    defs.pop(key, None)
json.dump(defs, open(path, "w"))
PY
  $DC cp data/restore/rabbitmq-definitions.json rabbitmq:/tmp/rabbitmq-definitions.json
  $DC exec -T rabbitmq rabbitmqctl import_definitions /tmp/rabbitmq-definitions.json
  $DC exec -T rabbitmq rm -f /tmp/rabbitmq-definitions.json
  rm -f data/restore/rabbitmq-definitions.json
fi

echo "==> Bật tất cả"
$DC up -d --remove-orphans

if [ -f fix-timestamps.js ]; then
  $DC exec -T mongodb sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "$0"' \
    "$(cat fix-timestamps.js)" || echo "   (timestamp repair failed)"
fi
if [ -f seed-demo-booking.js ]; then
  $DC exec -T mongodb sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "$0"' \
    "$(cat seed-demo-booking.js)" || echo "   (demo booking not created)"
fi
[ "$RESTORE" = 1 ] && rm -f data.tar.gz

echo
echo "==> Kiểm tra"
$DC ps --format 'table {{.Service}}\t{{.Status}}'
echo "-- RabbitMQ queues"
$DC exec -T rabbitmq rabbitmqctl list_queues -q name durable arguments
echo "-- MongoDB: số document mỗi collection"
$DC exec -T mongodb sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "
  db.adminCommand({ listDatabases: 1 }).databases
    .filter(d => ![\"admin\", \"config\", \"local\"].includes(d.name))
    .forEach(d => { const x = db.getSiblingDB(d.name);
      x.getCollectionNames().sort().forEach(c => print(d.name + \".\" + c + \": \" + x[c].countDocuments())); })"'
echo
echo "PRIVATE IP (dùng cho --data-ip): $PRIVATE_IP"
echo "PUBLIC IP  (dùng cho --turn-ip): $PUBLIC_IP"
exit 0
}
