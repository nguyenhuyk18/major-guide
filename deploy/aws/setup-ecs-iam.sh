#!/usr/bin/env bash
# Tạo 2 IAM role cho ECS (chạy 1 lần trên máy bạn, Git Bash, từ thư mục major-guide):
#   bash deploy/aws/setup-ecs-iam.sh
# - ecsInstanceRole (+ instance profile): cho máy EC2 trong cluster đăng ký với ECS, kéo image từ ECR
# - majorguide-ecs-task-execution: cho task đọc env file trên S3 (majorguide-config-*) và ghi log CloudWatch
# Chạy lại an toàn.
set -euo pipefail
export AWS_REGION=ap-southeast-1 AWS_PAGER="" MSYS_NO_PATHCONV=1
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"

trust() { echo "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"$1\"},\"Action\":\"sts:AssumeRole\"}]}"; }
ensure_role() { # <name> <service principal>
  if aws iam get-role --role-name "$1" >/dev/null 2>&1; then
    echo "    $1 (đã có)"
  else
    aws iam create-role --role-name "$1" --assume-role-policy-document "$(trust "$2")" >/dev/null
    echo "    $1 (vừa tạo)"
  fi
}

echo "==> ecsInstanceRole"
ensure_role ecsInstanceRole ec2.amazonaws.com
aws iam attach-role-policy --role-name ecsInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role
aws iam attach-role-policy --role-name ecsInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
if ! aws iam get-instance-profile --instance-profile-name ecsInstanceRole >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name ecsInstanceRole >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name ecsInstanceRole --role-name ecsInstanceRole
fi

echo "==> majorguide-ecs-task-execution"
ensure_role majorguide-ecs-task-execution ecs-tasks.amazonaws.com
aws iam attach-role-policy --role-name majorguide-ecs-task-execution \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam put-role-policy --role-name majorguide-ecs-task-execution --policy-name read-env-file --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    { \"Effect\": \"Allow\", \"Action\": \"s3:GetObject\", \"Resource\": \"arn:aws:s3:::majorguide-config-$ACCOUNT/*\" },
    { \"Effect\": \"Allow\", \"Action\": \"s3:GetBucketLocation\", \"Resource\": \"arn:aws:s3:::majorguide-config-$ACCOUNT\" }
  ]
}"

echo
echo "Xong. Báo lại cho Claude để làm tiếp."
