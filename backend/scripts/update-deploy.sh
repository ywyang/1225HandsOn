#!/bin/bash
set -e

EC2_IP="54.89.123.129"
KEY_FILE="$HOME/ec2world/us-east-1.pem"

echo "🚀 开始部署更新..."
echo "✅ EC2 IP: $EC2_IP"
if [ ! -f "$KEY_FILE" ]; then
  echo "❌ 找不到密钥文件: $KEY_FILE"
  exit 1
fi

# 打包代码
echo "📦 打包代码..."
cd "$(dirname "$0")/.."
tar czf /tmp/update.tar.gz backend frontend

# 上传到 EC2
echo "📤 上传代码到 EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no /tmp/update.tar.gz ec2-user@$EC2_IP:/tmp/

# 在 EC2 上执行更新
echo "🔄 执行更新..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'EOF'
set -e
cd /opt/hands-on-training
tar xzf /tmp/update.tar.gz
cd backend
npm install --production
pm2 restart hands-on-backend
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html
sudo mkdir -p /var/www/html
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
echo "✅ 更新完成"
EOF

echo "🎉 部署更新成功！"
echo "🌐 访问地址: http://$EC2_IP"
