#!/usr/bin/env bash
# JalLoop AutoReserve - AWS SAM Deployment Script (Bash)
set -e

STACK_NAME=${1:-"jalloop-autoreserve-stack"}
REGION=${2:-"us-east-1"}

echo "=========================================================="
echo " Deploying JalLoop AutoReserve to AWS (SAM) "
echo "=========================================================="

if ! command -v sam &> /dev/null; then
    echo "[ERROR] AWS SAM CLI is not installed."
    echo "Install SAM CLI from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

echo "[Step 1/2] Building SAM application..."
sam build --template template.yaml

echo "[Step 2/2] Deploying stack '$STACK_NAME' to region '$REGION'..."
sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset

echo "=========================================================="
echo " Deployment Complete! "
echo "=========================================================="
