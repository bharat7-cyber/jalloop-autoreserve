# JalLoop AutoReserve - AWS SAM Deployment Script (PowerShell)
param (
    [string]$StackName = "jalloop-autoreserve-stack",
    [string]$Region = "us-east-1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Deploying JalLoop AutoReserve to AWS (SAM) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check AWS SAM CLI
if (-not (Get-Command "sam" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS SAM CLI is not installed." -ForegroundColor Red
    Write-Host "Install SAM CLI from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
    exit 1
}

# 2. Check AWS Credentials
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Host "[WARNING] AWS CLI not found in PATH. Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set." -ForegroundColor Yellow
}

Write-Host "[Step 1/2] Building SAM application..." -ForegroundColor Green
sam build --template template.yaml

Write-Host "[Step 2/2] Deploying stack '$StackName' to region '$Region'..." -ForegroundColor Green
sam deploy `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM `
    --resolve-s3 `
    --no-confirm-changeset

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Deployment Complete! Retrieve your API Gateway URL above. " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
