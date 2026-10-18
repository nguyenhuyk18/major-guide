"""Tạo deploy/.env.ecs (env file dùng chung cho các ECS task) từ deploy/.env.production.

Chạy trên máy bạn, từ thư mục major-guide:
    python deploy/aws/make_env_ecs.py --data-ip 172.31.5.10 --turn-ip 13.250.1.2 \
        --public-url https://d1234abcd.cloudfront.net

- Tên container database (mongodb, rabbitmq, redis, keycloak, qdrant) -> private IP của EC2 data.
  Tên các service NestJS (slot, booking, bff, agentic-ai...) giữ nguyên: Service Connect lo phần đó.
- Domain sslip.io cũ -> URL CloudFront (Stripe redirect, CORS). TURN -> Elastic IP của EC2 data.
- Bỏ dấu nháy quanh giá trị: env file của ECS giữ nguyên dấu nháy, khác với docker compose.
"""
import argparse
import re
from pathlib import Path

DEPLOY = Path(__file__).resolve().parent.parent
SRC = DEPLOY / '.env.production'
DST = DEPLOY / '.env.ecs'

# Chỉ EC2 data / docker compose dùng, task ECS không cần.
DROP = {'DOMAIN', 'PUBLIC_IP', 'PRIVATE_IP', 'MONGO_ROOT_USER', 'MONGO_ROOT_PASSWORD',
        'RABBITMQ_USER', 'RABBITMQ_PASSWORD'}
DATA_HOSTS = r'(mongodb|rabbitmq|redis|keycloak|qdrant)'


def read_env(path):
    env = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in '\'"':
            value = value[1:-1]
        env[key.strip()] = value
    return env


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--data-ip', required=True, help='private IP của EC2 majorguide-data')
    parser.add_argument('--turn-ip', required=True, help='Elastic IP của EC2 majorguide-data')
    parser.add_argument('--public-url', required=True, help='https://dxxxx.cloudfront.net')
    args = parser.parse_args()
    url = args.public_url.rstrip('/')
    data = args.data_ip

    env = read_env(SRC)
    old_origin = 'https://' + env['DOMAIN']

    env['MONGODB_URI'] = re.sub(r'@mongodb:', f'@{data}:', env['MONGODB_URI'])
    env['RABBITMQ_SERVER_HOST'] = env['RABBITMQ_SERVER_HOST'].replace('@rabbitmq:', f'@{data}:')
    env['REDIS_HOST'] = data
    env['KEYCLOAK_HOST'] = f'http://{data}:8080'
    env['QDRANT_URL'] = f'http://{data}:6333'
    for key in ('STRIPE_SUCCESS_URL', 'STRIPE_CANCEL_URL'):
        env[key] = env[key].replace(old_origin, url)
    env['CORS_ALLOWED_ORIGINS'] = url
    env['WEBRTC_TURN_URL'] = f'turn:{args.turn_ip}:3478'
    for key in DROP:
        env.pop(key, None)

    leftovers = [k for k, v in env.items() if re.search(rf'(//|@){DATA_HOSTS}(:|/|$)', v) or re.fullmatch(DATA_HOSTS, v)]
    if leftovers:
        raise SystemExit(f'Vẫn còn trỏ tới tên container database: {leftovers}')

    DST.write_text(''.join(f'{k}={v}\n' for k, v in env.items()), encoding='utf-8', newline='\n')
    print(f'Đã tạo {DST} ({len(env)} biến). File này chứa secret, không commit.')
    print(f'  MongoDB / RabbitMQ / Redis / Keycloak / Qdrant -> {data}')
    print(f'  Public URL -> {url}   TURN -> turn:{args.turn_ip}:3478')


if __name__ == '__main__':
    main()
