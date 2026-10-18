#!/usr/bin/env bash
# Bật / tắt toàn bộ MajorGuide trên AWS (chạy trên máy bạn, Git Bash, từ thư mục major-guide):
#   bash deploy/aws/demo.sh on      # trước buổi báo cáo, ~10 phút
#   bash deploy/aws/demo.sh off     # sau buổi báo cáo: còn tốn ổ đĩa + Elastic IP + ALB
#   bash deploy/aws/demo.sh status
set -euo pipefail
export AWS_REGION=ap-southeast-1 AWS_PAGER=""
CLUSTER=majorguide
ASG=majorguide-ecs-asg
APP_INSTANCES=2
SERVICES="authorizer user-access booking slot chat media mail bff agentic-ai"
URL=https://3-0-13-6.sslip.io

DATA_ID="$(aws ec2 describe-instances --filters Name=tag:Name,Values=majorguide-data \
  Name=instance-state-name,Values=pending,running,stopping,stopped \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)"

status() {
  echo "EC2 data:  $(aws ec2 describe-instances --instance-ids "$DATA_ID" --query 'Reservations[0].Instances[0].State.Name' --output text)"
  echo "Máy ECS:   $(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG \
    --query 'AutoScalingGroups[0].length(Instances)' --output text) / mong muốn $(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names $ASG --query 'AutoScalingGroups[0].DesiredCapacity' --output text)"
  # shellcheck disable=SC2086
  aws ecs describe-services --cluster $CLUSTER --services $SERVICES \
    --query 'services[].[serviceName,runningCount,desiredCount]' --output text | awk '{printf "  %-12s %s/%s\n", $1, $2, $3}'
}

case "${1:-status}" in
  on)
    echo "==> Bật EC2 data (database + HTTPS)"
    aws ec2 start-instances --instance-ids "$DATA_ID" >/dev/null
    aws ec2 wait instance-running --instance-ids "$DATA_ID"
    echo "==> Bật $APP_INSTANCES máy ECS"
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name $ASG \
      --min-size 0 --max-size $APP_INSTANCES --desired-capacity $APP_INSTANCES
    echo "==> Bật 9 service"
    for s in $SERVICES; do
      aws ecs update-service --cluster $CLUSTER --service "$s" --desired-count 1 >/dev/null
    done
    echo "==> Đợi service chạy (máy mới cần vài phút để kéo image)"
    # shellcheck disable=SC2086
    aws ecs wait services-stable --cluster $CLUSTER --services $SERVICES \
      || echo "   Vẫn đang khởi động, chạy: bash deploy/aws/demo.sh status"
    status
    echo
    echo "Web: $URL"
    ;;
  off)
    echo "==> Tắt 9 service"
    for s in $SERVICES; do
      aws ecs update-service --cluster $CLUSTER --service "$s" --desired-count 0 >/dev/null
    done
    # shellcheck disable=SC2086
    aws ecs wait services-stable --cluster $CLUSTER --services $SERVICES || true
    echo "==> Tắt máy ECS"
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name $ASG \
      --min-size 0 --max-size 0 --desired-capacity 0
    echo "==> Tắt EC2 data (data giữ nguyên trên ổ EBS)"
    aws ec2 stop-instances --instance-ids "$DATA_ID" >/dev/null
    echo "Đã tắt. Bật lại: bash deploy/aws/demo.sh on"
    ;;
  status)
    status
    ;;
  *)
    echo "Dùng: bash deploy/aws/demo.sh on|off|status"; exit 1
    ;;
esac
