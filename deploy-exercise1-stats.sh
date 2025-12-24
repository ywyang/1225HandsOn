#!/bin/bash

set -e

EC2_IP="100.49.176.211"
KEY_FILE="~/ec2world/us-east-1.pem"
EC2_USER="ec2-user"

echo "🚀 Deploying Exercise 1 Stats to EC2..."

# 1. Copy backend files
echo "📦 Copying backend files..."
scp -i $KEY_FILE backend/backend/src/routes/exercise1-stats.js $EC2_USER@$EC2_IP:/tmp/
scp -i $KEY_FILE backend/backend/src/app.js $EC2_USER@$EC2_IP:/tmp/

# 2. Copy frontend files
echo "📦 Copying frontend files..."
scp -i $KEY_FILE backend/frontend/src/pages/admin/Exercise1Stats.tsx $EC2_USER@$EC2_IP:/tmp/
scp -i $KEY_FILE backend/frontend/src/components/Layout/Sidebar.tsx $EC2_USER@$EC2_IP:/tmp/
scp -i $KEY_FILE backend/frontend/src/App.tsx $EC2_USER@$EC2_IP:/tmp/

# 3. Deploy on EC2
echo "🔧 Deploying on EC2..."
ssh -i $KEY_FILE $EC2_USER@$EC2_IP << 'EOF'
  set -e
  
  # Update backend
  echo "Updating backend..."
  sudo cp /tmp/exercise1-stats.js /opt/hands-on-training/backend/src/routes/
  sudo cp /tmp/app.js /opt/hands-on-training/backend/src/
  sudo chown -R ec2-user:ec2-user /opt/hands-on-training/backend/src/
  
  # Restart backend
  cd /opt/hands-on-training/backend
  pm2 restart hands-on-backend --update-env
  
  # Update frontend
  echo "Updating frontend..."
  sudo mkdir -p /opt/hands-on-training/frontend/src/pages/admin
  sudo cp /tmp/Exercise1Stats.tsx /opt/hands-on-training/frontend/src/pages/admin/
  sudo cp /tmp/Sidebar.tsx /opt/hands-on-training/frontend/src/components/Layout/
  sudo cp /tmp/App.tsx /opt/hands-on-training/frontend/src/
  sudo chown -R ec2-user:ec2-user /opt/hands-on-training/frontend/src/
  
  # Rebuild frontend
  echo "Building frontend..."
  cd /opt/hands-on-training/frontend
  npm run build
  
  # Reload nginx
  sudo systemctl reload nginx
  
  echo "✅ Deployment complete!"
EOF

echo ""
echo "✅ Exercise 1 Stats deployed successfully!"
echo "🌐 Access at: http://$EC2_IP/admin/exercise1-stats"
echo ""
echo "📊 Check backend logs: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs hands-on-backend'"
