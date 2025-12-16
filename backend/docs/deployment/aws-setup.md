# AWS Deployment Setup

This document outlines the steps to deploy the Hands-on Training System on AWS infrastructure.

## Architecture Overview

```
Internet Gateway
    │
    ▼
Application Load Balancer (Public Subnets)
    │
    ▼
EC2 Instances (Private Subnets)
    │
    ▼
RDS PostgreSQL (Private Subnets)
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Domain name (optional, for custom domain)
- SSL certificate (for HTTPS)

## Infrastructure Components

### 1. VPC and Networking
- VPC with public and private subnets
- Internet Gateway
- NAT Gateway for private subnet internet access
- Route tables and security groups

### 2. Database (RDS)
- PostgreSQL instance in private subnet
- Automated backups enabled
- Multi-AZ deployment for production

### 3. Application Server (EC2)
- EC2 instances in private subnets
- Auto Scaling Group
- Application Load Balancer

### 4. Frontend (S3 + CloudFront)
- S3 bucket for static assets
- CloudFront distribution for CDN
- Route 53 for DNS (optional)

## Deployment Steps

### Step 1: Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

### Step 2: Set up RDS Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name hands-on-training-db-subnet \
  --db-subnet-group-description "Subnet group for hands-on training DB" \
  --subnet-ids subnet-xxx subnet-yyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier hands-on-training-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --db-subnet-group-name hands-on-training-db-subnet
```

### Step 3: Deploy Backend Application

```bash
# Create EC2 launch template
aws ec2 create-launch-template \
  --launch-template-name hands-on-training-backend \
  --launch-template-data file://launch-template.json

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name hands-on-training-asg \
  --launch-template LaunchTemplateName=hands-on-training-backend \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 2 \
  --vpc-zone-identifier subnet-xxx,subnet-yyy
```

### Step 4: Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket
aws s3 mb s3://hands-on-training-frontend

# Upload build files
aws s3 sync dist/ s3://hands-on-training-frontend/

# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## Environment Variables

Set the following environment variables on EC2 instances:

```bash
NODE_ENV=production
DB_HOST=your-rds-endpoint
DB_NAME=hands_on_training
DB_USER=postgres
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
```

## Security Considerations

1. **Database Security**
   - Place RDS in private subnets
   - Use security groups to restrict access
   - Enable encryption at rest

2. **Application Security**
   - Use HTTPS only
   - Implement proper CORS policies
   - Regular security updates

3. **Network Security**
   - Use WAF with CloudFront
   - Implement proper security groups
   - Monitor with CloudTrail

## Monitoring and Logging

- CloudWatch for application metrics
- CloudWatch Logs for application logs
- RDS monitoring for database performance
- CloudFront access logs

## Backup and Recovery

- RDS automated backups
- Application code in version control
- Infrastructure as Code (CloudFormation/Terraform)

## Cost Optimization

- Use appropriate instance sizes
- Implement auto-scaling
- Use Reserved Instances for predictable workloads
- Monitor costs with AWS Cost Explorer