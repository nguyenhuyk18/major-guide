"""Tạo / cập nhật toàn bộ ECS cho MajorGuide (README bước 7-8). Chạy trên máy bạn, từ thư mục major-guide:
    python deploy/aws/ecs_setup.py

Cần có trước: image trên ECR (CI/CD), deploy/.env.ecs (make_env_ecs.py), IAM role (setup-ecs-iam.sh),
security group majorguide-ecs, target group majorguide-bff + majorguide-ai (setup-edge.sh).

Tạo: cluster "majorguide" + namespace Service Connect "majorguide", log group /ecs/majorguide,
bucket env file, launch template + Auto Scaling Group (2 máy t3.large), 9 task definition, 9 service.
Mọi service dùng chung 1 env file trên S3 (giống env_file của docker compose).
Chạy lại an toàn: cái gì đã có thì cập nhật (task definition mới, service deploy lại).
"""
import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

REGION = 'ap-southeast-1'
CLUSTER = NAMESPACE = 'majorguide'
INSTANCE_TYPE = 't3.large'
APP_INSTANCES = 2
KEY_NAME = 'major-guide'
LOG_GROUP = '/ecs/majorguide'
ASG_NAME = 'majorguide-ecs-asg'
LAUNCH_TEMPLATE = 'majorguide-ecs'
EXEC_ROLE = 'majorguide-ecs-task-execution'
ENV_FILE = Path(__file__).resolve().parent.parent / '.env.ecs'

os.environ['AWS_PAGER'] = ''


def aws(*args, check=True, text_out=False):
    cmd = ['aws', '--region', REGION, *args, '--output', 'text' if text_out else 'json']
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        if check:
            sys.exit(f'\n!! aws {" ".join(args[:2])} lỗi:\n{r.stderr.strip()}')
        return None
    out = r.stdout.strip()
    if text_out:
        return out
    return json.loads(out) if out else {}


def log(msg):
    print(msg, flush=True)


def read_env(path):
    env = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env


if not ENV_FILE.exists():
    sys.exit(f'Thiếu {ENV_FILE}: chạy deploy/aws/make_env_ecs.py trước')
ENV = read_env(ENV_FILE)
port = lambda key: int(ENV[key])

ACCOUNT = aws('sts', 'get-caller-identity', '--query', 'Account', text_out=True)
REGISTRY = f'{ACCOUNT}.dkr.ecr.{REGION}.amazonaws.com'
CONFIG_BUCKET = f'majorguide-config-{ACCOUNT}'
ENV_OBJECT = 'majorguide.env'


def nest(name, ports, **extra):
    return dict(name=name, repo='majorguide/nest', ports=ports,
                command=['node', f'dist/apps/{name}/main.js'],
                env={'NODE_OPTIONS': '--max-old-space-size=384'}, memory=512, reservation=256, **extra)


# portName -> containerPort. Service Connect cho các service khác gọi <tên service>:<port>, đúng như compose.
SERVICES = [
    nest('authorizer', {'authorizer-tcp': port('TCP_AUTHORIZER_SERVICE_PORT'),
                        'authorizer-grpc': port('GRPC_AUTHORIZE_SERVICE_PORT')}),
    nest('user-access', {'user-access-tcp': port('TCP_USER_ACCESS_SERVICE_PORT'),
                         'user-access-grpc': port('GRPC_USER_ACCESS_SERVICE_PORT')}),
    nest('booking', {'booking-tcp': port('TCP_BOOKING_SERVICE_PORT')}),
    nest('slot', {'slot-tcp': port('TCP_SLOT_SERVICE_PORT')}),
    nest('chat', {'chat-tcp': port('TCP_CHAT_SERVICE_PORT'), 'chat-http': port('CHAT_PORT')}),
    nest('media', {'media-tcp': port('TCP_MEDIA_SERVICE_PORT')}),
    nest('mail', {}),
    nest('bff', {'bff-http': port('PORT')}, target_group='majorguide-bff', lb_port=port('PORT'), grace=120),
    dict(name='agentic-ai', repo='majorguide/agentic-ai', ports={'agentic-ai-http': 8000},
         env={}, memory=4096, reservation=2560, models=True,
         target_group='majorguide-ai', lb_port=8000, grace=300),
]


def latest_image(repo):
    tag = aws('ecr', 'describe-images', '--repository-name', repo,
              '--query', 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags[0]', text_out=True)
    if not tag or tag == 'None':
        sys.exit(f'ECR {repo} chưa có image: đợi CI/CD build xong')
    return f'{REGISTRY}/{repo}:{tag}'


# ---------- cluster, namespace, logs, env file (không cần IAM) ----------
log('==> Cluster')
clusters = aws('ecs', 'describe-clusters', '--clusters', CLUSTER)['clusters']
if not clusters or clusters[0]['status'] != 'ACTIVE':
    aws('ecs', 'create-cluster', '--cluster-name', CLUSTER,
        '--service-connect-defaults', f'namespace={NAMESPACE}')
    log(f'    {CLUSTER} (vừa tạo)')
else:
    log(f'    {CLUSTER} (đã có)')
for _ in range(30):
    ns = aws('servicediscovery', 'list-namespaces',
             '--query', f"Namespaces[?Name=='{NAMESPACE}'].Id | [0]", text_out=True)
    if ns and ns != 'None':
        break
    time.sleep(5)
else:
    sys.exit('Namespace Service Connect chưa sẵn sàng, chạy lại sau ít phút')
log(f'    namespace {NAMESPACE}: {ns}')

log('==> Log group')
aws('logs', 'create-log-group', '--log-group-name', LOG_GROUP, check=False)
aws('logs', 'put-retention-policy', '--log-group-name', LOG_GROUP, '--retention-in-days', '7')

log(f'==> Env file s3://{CONFIG_BUCKET}/{ENV_OBJECT}')
if aws('s3api', 'head-bucket', '--bucket', CONFIG_BUCKET, check=False) is None:
    aws('s3api', 'create-bucket', '--bucket', CONFIG_BUCKET,
        '--create-bucket-configuration', f'LocationConstraint={REGION}')
aws('s3api', 'put-public-access-block', '--bucket', CONFIG_BUCKET, '--public-access-block-configuration',
    'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true')
aws('s3', 'cp', str(ENV_FILE), f's3://{CONFIG_BUCKET}/{ENV_OBJECT}', text_out=True)

# ---------- phần cần IAM ----------
exec_role = aws('iam', 'get-role', '--role-name', EXEC_ROLE, '--query', 'Role.Arn', text_out=True, check=False)
profile = aws('iam', 'get-instance-profile', '--instance-profile-name', 'ecsInstanceRole', check=False)
if not exec_role or not profile:
    sys.exit('\n!! Chưa có IAM role: chạy  bash deploy/aws/setup-ecs-iam.sh  rồi chạy lại script này')

vpc = aws('ec2', 'describe-vpcs', '--filters', 'Name=is-default,Values=true', '--query', 'Vpcs[0].VpcId', text_out=True)
subnets = aws('ec2', 'describe-subnets', '--filters', f'Name=vpc-id,Values={vpc}', 'Name=default-for-az,Values=true',
              '--query', 'Subnets[].SubnetId', text_out=True).split()
ecs_sg = aws('ec2', 'describe-security-groups', '--filters', 'Name=group-name,Values=majorguide-ecs',
             f'Name=vpc-id,Values={vpc}', '--query', 'SecurityGroups[0].GroupId', text_out=True)

log('==> Launch template + Auto Scaling Group')
ami = aws('ssm', 'get-parameter', '--name', '/aws/service/ecs/optimized-ami/amazon-linux-2023/recommended/image_id',
          '--query', 'Parameter.Value', text_out=True)
user_data = '\n'.join([
    '#!/bin/bash',
    f'echo ECS_CLUSTER={CLUSTER} >> /etc/ecs/ecs.config',
    'mkdir -p /opt/majorguide/models',
    '',
])
lt_data = {
    'ImageId': ami,
    'InstanceType': INSTANCE_TYPE,
    'KeyName': KEY_NAME,
    'IamInstanceProfile': {'Name': 'ecsInstanceRole'},
    'NetworkInterfaces': [{'DeviceIndex': 0, 'AssociatePublicIpAddress': True,
                           'Groups': [ecs_sg], 'DeleteOnTermination': True}],
    'BlockDeviceMappings': [{'DeviceName': '/dev/xvda',
                             'Ebs': {'VolumeSize': 40, 'VolumeType': 'gp3', 'DeleteOnTermination': True}}],
    'UserData': base64.b64encode(user_data.encode()).decode(),
    'MetadataOptions': {'HttpTokens': 'required', 'HttpPutResponseHopLimit': 2},
    'TagSpecifications': [{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': 'majorguide-ecs'}]}],
}
existing_lt = aws('ec2', 'describe-launch-templates', '--filters',
                  f'Name=launch-template-name,Values={LAUNCH_TEMPLATE}')['LaunchTemplates']
if existing_lt:
    aws('ec2', 'create-launch-template-version', '--launch-template-name', LAUNCH_TEMPLATE,
        '--launch-template-data', json.dumps(lt_data))
else:
    aws('ec2', 'create-launch-template', '--launch-template-name', LAUNCH_TEMPLATE,
        '--launch-template-data', json.dumps(lt_data))
asg = aws('autoscaling', 'describe-auto-scaling-groups', '--auto-scaling-group-names', ASG_NAME)['AutoScalingGroups']
if asg:
    aws('autoscaling', 'update-auto-scaling-group', '--auto-scaling-group-name', ASG_NAME,
        '--launch-template', f'LaunchTemplateName={LAUNCH_TEMPLATE},Version=$Latest',
        '--min-size', '0', '--max-size', str(APP_INSTANCES), '--desired-capacity', str(APP_INSTANCES), text_out=True)
    log(f'    {ASG_NAME} (đã có, {APP_INSTANCES} máy)')
else:
    aws('autoscaling', 'create-auto-scaling-group', '--auto-scaling-group-name', ASG_NAME,
        '--launch-template', f'LaunchTemplateName={LAUNCH_TEMPLATE},Version=$Latest',
        '--min-size', '0', '--max-size', str(APP_INSTANCES), '--desired-capacity', str(APP_INSTANCES),
        '--vpc-zone-identifier', ','.join(subnets), text_out=True)
    log(f'    {ASG_NAME} (vừa tạo, {APP_INSTANCES} máy {INSTANCE_TYPE})')

log('==> Đợi máy EC2 đăng ký vào cluster')
for i in range(60):
    count = len(aws('ecs', 'list-container-instances', '--cluster', CLUSTER)['containerInstanceArns'])
    if count >= APP_INSTANCES:
        break
    if i % 6 == 0:
        log(f'    {count}/{APP_INSTANCES}...')
    time.sleep(10)
else:
    sys.exit('Máy EC2 chưa đăng ký vào cluster sau 10 phút: xem EC2 -> Instances "majorguide-ecs"')
log(f'    {count} máy sẵn sàng')

# ---------- task definitions + services ----------
images = {repo: latest_image(repo) for repo in {s['repo'] for s in SERVICES}}
target_groups = {}
for s in SERVICES:
    if 'target_group' in s:
        target_groups[s['name']] = aws('elbv2', 'describe-target-groups', '--names', s['target_group'],
                                       '--query', 'TargetGroups[0].TargetGroupArn', text_out=True)

log('==> Task definitions + services')
for s in SERVICES:
    name = s['name']
    container = {
        'name': name,
        'image': images[s['repo']],
        'essential': True,
        'memory': s['memory'],
        'memoryReservation': s['reservation'],
        'portMappings': [{'name': pn, 'containerPort': p, 'hostPort': 0, 'protocol': 'tcp'}
                         for pn, p in s['ports'].items()],
        'environment': [{'name': k, 'value': v} for k, v in {'TZ': 'Asia/Ho_Chi_Minh', **s['env']}.items()],
        'environmentFiles': [{'type': 's3', 'value': f'arn:aws:s3:::{CONFIG_BUCKET}/{ENV_OBJECT}'}],
        'logConfiguration': {'logDriver': 'awslogs', 'options': {
            'awslogs-group': LOG_GROUP, 'awslogs-region': REGION, 'awslogs-stream-prefix': name}},
    }
    if 'command' in s:
        container['command'] = s['command']
    task_def = {
        'family': f'majorguide-{name}',
        'networkMode': 'bridge',
        'requiresCompatibilities': ['EC2'],
        'executionRoleArn': exec_role,
        'containerDefinitions': [container],
    }
    if s.get('models'):
        container['mountPoints'] = [{'sourceVolume': 'hf-models', 'containerPath': '/models'}]
        task_def['volumes'] = [{'name': 'hf-models', 'host': {'sourcePath': '/opt/majorguide/models'}}]
    td_arn = aws('ecs', 'register-task-definition', '--cli-input-json', json.dumps(task_def),
                 '--query', 'taskDefinition.taskDefinitionArn', text_out=True)

    service_connect = {'enabled': True, 'namespace': NAMESPACE}
    if s['ports']:
        service_connect['services'] = [
            {'portName': pn, 'discoveryName': pn, 'clientAliases': [{'port': p, 'dnsName': name}]}
            for pn, p in s['ports'].items()]
    deployment = {'deploymentCircuitBreaker': {'enable': True, 'rollback': True},
                  'minimumHealthyPercent': 100, 'maximumPercent': 200}
    spec = {'taskDefinition': td_arn, 'serviceConnectConfiguration': service_connect,
            'deploymentConfiguration': deployment}
    if name in target_groups:
        spec['loadBalancers'] = [{'targetGroupArn': target_groups[name], 'containerName': name,
                                  'containerPort': s['lb_port']}]
        spec['healthCheckGracePeriodSeconds'] = s['grace']

    current = aws('ecs', 'describe-services', '--cluster', CLUSTER, '--services', name)['services']
    if current and current[0]['status'] == 'ACTIVE':
        aws('ecs', 'update-service', '--cli-input-json', json.dumps(
            {'cluster': CLUSTER, 'service': name, 'forceNewDeployment': True, **spec}), '--query', 'service.serviceName', text_out=True)
        log(f'    {name:12} cập nhật  {td_arn.split("/")[-1]}')
    else:
        aws('ecs', 'create-service', '--cli-input-json', json.dumps(
            {'cluster': CLUSTER, 'serviceName': name, 'desiredCount': 1, 'launchType': 'EC2',
             'placementStrategy': [{'type': 'spread', 'field': 'instanceId'}], **spec}),
            '--query', 'service.serviceName', text_out=True)
        log(f'    {name:12} vừa tạo   {td_arn.split("/")[-1]}')

log('\nXong. Các service đang khởi động (3-8 phút). Xem: ECS -> Clusters -> majorguide -> Services')
