#!/usr/bin/env bash
# Chạy 1 lần trên máy bạn (Git Bash, AWS CLI đã `aws configure`), từ thư mục major-guide:
#   bash deploy/aws/setup-cicd.sh
# Tạo:
#   - ECR repo majorguide/nest, majorguide/agentic-ai (tag immutable, scan on push, giữ 20 image gần nhất)
#   - OIDC provider cho GitHub Actions (không cần lưu access key trên GitHub)
#   - IAM role majorguide-github-actions: chỉ 3 repo, chỉ nhánh main mới dùng được
# Chạy lại nhiều lần vẫn an toàn.
set -euo pipefail
export AWS_REGION=ap-southeast-1 AWS_PAGER="" MSYS_NO_PATHCONV=1

GITHUB_OWNER=nguyenhuyk18
GITHUB_REPOS=(major-guide agentic-service major-guide-fe)
ECR_REPOS=(majorguide/nest majorguide/agentic-ai)
ROLE_NAME=majorguide-github-actions
OIDC_HOST=token.actions.githubusercontent.com

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
echo "==> AWS account $ACCOUNT, region $AWS_REGION"

echo "==> ECR repositories"
LIFECYCLE='{"rules":[{"rulePriority":1,"description":"keep last 20 images","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":20},"action":{"type":"expire"}}]}'
for repo in "${ECR_REPOS[@]}"; do
  if aws ecr describe-repositories --repository-names "$repo" >/dev/null 2>&1; then
    echo "    $repo (đã có)"
  else
    aws ecr create-repository --repository-name "$repo" \
      --image-tag-mutability IMMUTABLE \
      --image-scanning-configuration scanOnPush=true >/dev/null
    echo "    $repo (vừa tạo)"
  fi
  aws ecr put-lifecycle-policy --repository-name "$repo" --lifecycle-policy-text "$LIFECYCLE" >/dev/null
done

echo "==> GitHub OIDC provider"
OIDC_ARN="arn:aws:iam::$ACCOUNT:oidc-provider/$OIDC_HOST"
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" >/dev/null 2>&1; then
  echo "    đã có"
else
  aws iam create-open-id-connect-provider --url "https://$OIDC_HOST" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
  echo "    vừa tạo"
fi

SUBS=""
for r in "${GITHUB_REPOS[@]}"; do SUBS="$SUBS\"repo:$GITHUB_OWNER/$r:ref:refs/heads/main\","; done
SUBS="${SUBS%,}"

TRUST=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "$OIDC_ARN" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "$OIDC_HOST:aud": "sts.amazonaws.com" },
      "StringLike": { "$OIDC_HOST:sub": [$SUBS] }
    }
  }]
}
EOF
)

# Quy ước tên dùng ở các bước sau: role ECS đặt tên majorguide-*, bucket frontend majorguide-web-*.
POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "EcrLogin", "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
    { "Sid": "EcrPush", "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:CompleteLayerUpload",
                 "ecr:DescribeImages", "ecr:GetDownloadUrlForLayer", "ecr:InitiateLayerUpload",
                 "ecr:PutImage", "ecr:UploadLayerPart"],
      "Resource": "arn:aws:ecr:$AWS_REGION:$ACCOUNT:repository/majorguide/*" },
    { "Sid": "EcsDeploy", "Effect": "Allow",
      "Action": ["ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition", "ecs:DescribeServices",
                 "ecs:UpdateService", "ecs:TagResource"],
      "Resource": "*" },
    { "Sid": "PassEcsRoles", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::$ACCOUNT:role/majorguide-*",
      "Condition": { "StringEquals": { "iam:PassedToService": "ecs-tasks.amazonaws.com" } } },
    { "Sid": "FrontendBucket", "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::majorguide-web-*", "arn:aws:s3:::majorguide-web-*/*"] },
    { "Sid": "FrontendCdn", "Effect": "Allow", "Action": "cloudfront:CreateInvalidation", "Resource": "*" }
  ]
}
EOF
)

echo "==> IAM role $ROLE_NAME"
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document "$TRUST"
  echo "    đã có, cập nhật trust policy"
else
  aws iam create-role --role-name "$ROLE_NAME" \
    --description "GitHub Actions CI/CD for MajorGuide" \
    --assume-role-policy-document "$TRUST" >/dev/null
  echo "    vừa tạo"
fi
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name majorguide-cicd --policy-document "$POLICY"

ROLE_ARN="arn:aws:iam::$ACCOUNT:role/$ROLE_NAME"
echo
echo "Xong. Thêm repo variable sau vào CẢ 3 repo GitHub"
echo "(Settings -> Secrets and variables -> Actions -> tab Variables -> New repository variable):"
echo
echo "    AWS_ROLE_ARN = $ROLE_ARN"
echo
for r in "${GITHUB_REPOS[@]}"; do echo "    https://github.com/$GITHUB_OWNER/$r/settings/variables/actions"; done
