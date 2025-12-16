#!/bin/bash
set -e

REGION=${AWS_REGION:-us-east-1}
STACK_NAME="hands-on-training"
KEY_NAME="hands-on-training-key"

echo "=== Quick Deploy to AWS ==="
echo "Region: $REGION"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not installed"
    exit 1
fi

# Create Key Pair if not exists
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo "Creating EC2 Key Pair..."
    aws ec2 create-key-pair \
      --key-name $KEY_NAME \
      --query 'KeyMaterial' \
      --output text \
      --region $REGION > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "Key saved to ${KEY_NAME}.pem"
fi

# Generate DB Password
DB_PASSWORD=$(openssl rand -base64 16)
echo "Generated DB Password: $DB_PASSWORD"
echo "IMPORTANT: Save this password!"

# Deploy CloudFormation
echo "Deploying CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://scripts/cloudformation.yaml \
  --parameters \
    ParameterKey=KeyName,ParameterValue=$KEY_NAME \
    ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
  --capabilities CAPABILITY_IAM \
  --region $REGION

echo "Waiting for stack creation (this may take 10-15 minutes)..."
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $REGION

# Get outputs
echo "Getting stack outputs..."
EC2_IP=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`EC2PublicIP`].OutputValue' \
  --output text \
  --region $REGION)

RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSEndpoint`].OutputValue' \
  --output text \
  --region $REGION)

echo ""
echo "=== Deployment Complete ==="
echo "EC2 IP: $EC2_IP"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "DB Password: $DB_PASSWORD"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for EC2 to initialize"
echo "2. Upload code: scp -i ${KEY_NAME}.pem -r backend frontend scripts ec2-user@$EC2_IP:/tmp/"
echo "3. SSH: ssh -i ${KEY_NAME}.pem ec2-user@$EC2_IP"
echo "4. Deploy: sudo mv /tmp/{backend,frontend,scripts} /opt/hands-on-training/ && cd /opt/hands-on-training && ./scripts/deploy-ec2.sh"
echo "5. Access: http://$EC2_IP"
