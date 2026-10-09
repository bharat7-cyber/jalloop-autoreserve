"""
AWS Lambda Handler for JalLoop AutoReserve.
Wraps the FastAPI application using Mangum for AWS API Gateway (v1 REST and v2 HTTP APIs).
"""
from mangum import Mangum
from .main import app

# Handler entry point for AWS Lambda
# Configure in AWS Lambda console / SAM as: app.lambda_handler.handler
handler = Mangum(app, lifespan="off")
