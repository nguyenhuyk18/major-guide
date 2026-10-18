#!/usr/bin/env bash
# Tạo phần "cửa vào" của MajorGuide (README bước 5 + 6). Chạy trên máy bạn, từ thư mục major-guide:
#   bash deploy/aws/setup-edge.sh
# - Target group majorguide-bff (:3300, /api/v2/health) và majorguide-ai (:8000, /)
# - ALB majorguide-alb: mặc định -> bff, /ai và /ai/* -> agentic-ai
# - S3 majorguide-web-<account> (private) + CloudFront: / -> S3, /api/* /socket.io/* /ai/* -> ALB
# Chạy lại an toàn: cái gì đã có thì dùng lại.
set -euo pipefail
export AWS_REGION=ap-southeast-1 AWS_PAGER="" MSYS_NO_PATHCONV=1
HERE="$(cd "$(dirname "$0")" && pwd)"
log() { echo "$@" >&2; }
none() { [ -z "$1" ] || [ "$1" = None ] || [ "$1" = null ]; }

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
VPC="$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)"
SUBNETS="$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC" Name=default-for-az,Values=true --query 'Subnets[].SubnetId' --output text)"
ALB_SG="$(aws ec2 describe-security-groups --filters Name=group-name,Values=majorguide-alb Name=vpc-id,Values="$VPC" --query 'SecurityGroups[0].GroupId' --output text)"
none "$ALB_SG" && { log "Thiếu security group majorguide-alb (README bước 3)"; exit 1; }
BUCKET="majorguide-web-$ACCOUNT"
log "==> Account $ACCOUNT, VPC $VPC"

# ---------- Bước 5: target groups + ALB ----------
target_group() { # <name> <port> <health check path>
  local arn
  arn="$(aws elbv2 describe-target-groups --names "$1" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || true)"
  if none "$arn"; then
    arn="$(aws elbv2 create-target-group --name "$1" --protocol HTTP --port "$2" --vpc-id "$VPC" --target-type instance \
      --health-check-path "$3" --health-check-interval-seconds 15 --healthy-threshold-count 2 --unhealthy-threshold-count 3 \
      --matcher HttpCode=200 --query 'TargetGroups[0].TargetGroupArn' --output text)"
    log "    target group $1 (vừa tạo)"
  else
    log "    target group $1 (đã có)"
  fi
  aws elbv2 modify-target-group-attributes --target-group-arn "$arn" \
    --attributes Key=deregistration_delay.timeout_seconds,Value=30 >/dev/null
  echo "$arn"
}
log "==> Target groups"
TG_BFF="$(target_group majorguide-bff 3300 /api/v2/health)"
TG_AI="$(target_group majorguide-ai 8000 /)"

log "==> Load balancer"
ALB_ARN="$(aws elbv2 describe-load-balancers --names majorguide-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || true)"
if none "$ALB_ARN"; then
  # shellcheck disable=SC2086
  ALB_ARN="$(aws elbv2 create-load-balancer --name majorguide-alb --type application --scheme internet-facing \
    --ip-address-type ipv4 --subnets $SUBNETS --security-groups "$ALB_SG" \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)"
  log "    majorguide-alb (vừa tạo)"
else
  log "    majorguide-alb (đã có)"
fi
# socket.io giữ kết nối lâu
aws elbv2 modify-load-balancer-attributes --load-balancer-arn "$ALB_ARN" \
  --attributes Key=idle_timeout.timeout_seconds,Value=120 >/dev/null
ALB_DNS="$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)"

LISTENER="$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query 'Listeners[?Port==`80`].ListenerArn | [0]' --output text)"
if none "$LISTENER"; then
  LISTENER="$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
    --default-actions Type=forward,TargetGroupArn="$TG_BFF" --query 'Listeners[0].ListenerArn' --output text)"
  log "    listener :80 -> majorguide-bff (vừa tạo)"
fi
AI_RULE="$(aws elbv2 describe-rules --listener-arn "$LISTENER" --query "Rules[?Priority=='10'].RuleArn | [0]" --output text)"
if none "$AI_RULE"; then
  aws elbv2 create-rule --listener-arn "$LISTENER" --priority 10 \
    --conditions '[{"Field":"path-pattern","PathPatternConfig":{"Values":["/ai","/ai/*"]}}]' \
    --actions Type=forward,TargetGroupArn="$TG_AI" >/dev/null
  log "    rule /ai, /ai/* -> majorguide-ai (vừa tạo)"
fi

# ---------- Bước 6: S3 + CloudFront ----------
log "==> S3 bucket $BUCKET"
if ! aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  aws s3api create-bucket --bucket "$BUCKET" --create-bucket-configuration LocationConstraint="$AWS_REGION" >/dev/null
  log "    vừa tạo"
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
if ! aws s3api head-object --bucket "$BUCKET" --key index.html >/dev/null 2>&1; then
  echo '<!doctype html><meta charset="utf-8"><title>MajorGuide</title><p>MajorGuide: frontend chưa được deploy.</p>' \
    | aws s3 cp - "s3://$BUCKET/index.html" --content-type "text/html; charset=utf-8" --cache-control no-cache >/dev/null
fi

log "==> CloudFront function majorguide-spa"
CODE="$HERE/cloudfront-spa.js"
command -v cygpath >/dev/null && CODE="$(cygpath -w "$CODE")"
if aws cloudfront describe-function --name majorguide-spa >/dev/null 2>&1; then
  ETAG="$(aws cloudfront describe-function --name majorguide-spa --stage DEVELOPMENT --query ETag --output text)"
  ETAG="$(aws cloudfront update-function --name majorguide-spa --if-match "$ETAG" \
    --function-config Comment=spa-index-fallback,Runtime=cloudfront-js-2.0 --function-code "fileb://$CODE" --query ETag --output text)"
else
  ETAG="$(aws cloudfront create-function --name majorguide-spa \
    --function-config Comment=spa-index-fallback,Runtime=cloudfront-js-2.0 --function-code "fileb://$CODE" --query ETag --output text)"
fi
aws cloudfront publish-function --name majorguide-spa --if-match "$ETAG" >/dev/null
FN_ARN="$(aws cloudfront describe-function --name majorguide-spa --stage LIVE --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)"

log "==> Origin access control"
OAC="$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='majorguide-web-oac'].Id | [0]" --output text)"
if none "$OAC"; then
  OAC="$(aws cloudfront create-origin-access-control --origin-access-control-config \
    Name=majorguide-web-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3 \
    --query 'OriginAccessControl.Id' --output text)"
fi

cache_policy() { aws cloudfront list-cache-policies --type managed --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='$1'].CachePolicy.Id | [0]" --output text; }
CACHE_ON="$(cache_policy Managed-CachingOptimized)"
CACHE_OFF="$(cache_policy Managed-CachingDisabled)"
ALL_VIEWER="$(aws cloudfront list-origin-request-policies --type managed --query "OriginRequestPolicyList.Items[?OriginRequestPolicy.OriginRequestPolicyConfig.Name=='Managed-AllViewerExceptHostHeader'].OriginRequestPolicy.Id | [0]" --output text)"

api_behavior() {
  cat <<EOF
{ "PathPattern": "$1", "TargetOriginId": "alb", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
  "CachePolicyId": "$CACHE_OFF", "OriginRequestPolicyId": "$ALL_VIEWER",
  "AllowedMethods": { "Quantity": 7, "Items": ["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"],
                      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } } }
EOF
}

log "==> CloudFront distribution"
DIST_ID="$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='majorguide'].Id | [0]" --output text)"
if none "$DIST_ID"; then
  CONFIG=$(cat <<EOF
{
  "CallerReference": "majorguide-$(date +%s)",
  "Comment": "majorguide",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_200",
  "HttpVersion": "http2and3",
  "Origins": { "Quantity": 2, "Items": [
    { "Id": "s3-web", "DomainName": "$BUCKET.s3.$AWS_REGION.amazonaws.com",
      "OriginAccessControlId": "$OAC", "S3OriginConfig": { "OriginAccessIdentity": "" } },
    { "Id": "alb", "DomainName": "$ALB_DNS",
      "CustomOriginConfig": { "HTTPPort": 80, "HTTPSPort": 443, "OriginProtocolPolicy": "http-only",
        "OriginReadTimeout": 60, "OriginKeepaliveTimeout": 5,
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] } } }
  ] },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-web", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
    "CachePolicyId": "$CACHE_ON",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"], "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "FunctionAssociations": { "Quantity": 1, "Items": [ { "FunctionARN": "$FN_ARN", "EventType": "viewer-request" } ] }
  },
  "CacheBehaviors": { "Quantity": 3, "Items": [ $(api_behavior '/api/*'), $(api_behavior '/socket.io/*'), $(api_behavior '/ai/*') ] }
}
EOF
)
  DIST_ID="$(aws cloudfront create-distribution --distribution-config "$CONFIG" --query 'Distribution.Id' --output text)"
  log "    $DIST_ID (vừa tạo, mất khoảng 5-10 phút để chạy trên toàn cầu)"
else
  log "    $DIST_ID (đã có)"
fi
CF_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)"

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<EOF
{ "Version": "2012-10-17", "Statement": [ {
  "Sid": "AllowCloudFrontRead", "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$BUCKET/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID" } } } ] }
EOF
)"

cat <<EOF

Xong. Ghi lại các giá trị sau:
  PUBLIC_URL                  = https://$CF_DOMAIN
  S3_BUCKET                   = $BUCKET
  CLOUDFRONT_DISTRIBUTION_ID  = $DIST_ID
  ALB DNS                     = $ALB_DNS
EOF
