#!/bin/bash

# 部署修复后的前端到 EC2
# 使用方法: ./deploy-frontend-fix.sh

set -e

EC2_IP="54.89.123.129"
KEY_FILE="$HOME/ec2world/us-east-1.pem"
FRONTEND_DIR="backend/frontend"

echo "🚀 开始部署前端修复..."

# 1. 上传修改后的 Header.tsx 文件
echo "📤 上传修改后的文件..."
scp -i "$KEY_FILE" \
    "$FRONTEND_DIR/src/components/Layout/Header.tsx" \
    "ec2-user@$EC2_IP:/tmp/Header.tsx"

# 2. SSH 到服务器并执行构建和部署
echo "🔨 在服务器上构建和部署..."
ssh -i "$KEY_FILE" "ec2-user@$EC2_IP" << 'ENDSSH'
set -e

# 备份原文件
sudo cp /opt/hands-on-training/frontend/src/components/Layout/Header.tsx \
        /opt/hands-on-training/frontend/src/components/Layout/Header.tsx.backup

# 替换文件
sudo mv /tmp/Header.tsx /opt/hands-on-training/frontend/src/components/Layout/Header.tsx
sudo chown ec2-user:ec2-user /opt/hands-on-training/frontend/src/components/Layout/Header.tsx

# 重新构建前端
cd /opt/hands-on-training/frontend
npm run build

# 重启 Nginx
sudo systemctl reload nginx

echo "✅ 部署完成！"
ENDSSH

echo ""
echo "✅ 前端修复部署完成！"
echo "🌐 请访问: http://$EC2_IP/student"
echo ""
