#!/bin/bash
set -e

echo "=== Deploying Hands-on Training System to EC2 ==="

# Update system
sudo yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client
sudo yum install -y postgresql15

# Install PM2 globally
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /opt/hands-on-training
sudo chown -R ec2-user:ec2-user /opt/hands-on-training

# Clone or copy application files
cd /opt/hands-on-training

# Install backend dependencies
cd backend
npm install --production

# Setup database
echo "Setting up database..."
npm run migrate

# Build frontend
cd ../frontend
npm install
npm run build

# Setup Nginx for frontend
sudo yum install -y nginx
sudo cp /opt/hands-on-training/scripts/nginx.conf /etc/nginx/conf.d/hands-on-training.conf
sudo systemctl enable nginx
sudo systemctl restart nginx

# Start backend with PM2
cd /opt/hands-on-training/backend
pm2 start src/index.js --name hands-on-backend
pm2 save
pm2 startup

echo "=== Deployment Complete ==="
echo "Backend running on port 3000"
echo "Frontend served by Nginx on port 80"
