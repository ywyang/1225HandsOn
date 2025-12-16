# AWS 部署指南

## 架构概览

- **EC2**: 运行 Node.js 后端和 Nginx（前端静态文件）
- **RDS PostgreSQL**: 数据库
- **VPC**: 网络隔离
- **Security Groups**: 安全控制

## 部署步骤

### 方式一：使用 CloudFormation（推荐）

1. **创建 EC2 Key Pair**
```bash
aws ec2 create-key-pair \
  --key-name hands-on-training-key \
  --query 'KeyMaterial' \
  --output text > hands-on-training-key.pem
chmod 400 hands-on-training-key.pem
```

2. **部署 CloudFormation Stack**
```bash
aws cloudformation create-stack \
  --stack-name hands-on-training \
  --template-body file://scripts/cloudformation.yaml \
  --parameters \
    ParameterKey=KeyName,ParameterValue=hands-on-training-key \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **等待 Stack 创建完成**
```bash
aws cloudformation wait stack-create-complete \
  --stack-name hands-on-training \
  --region us-east-1
```

4. **获取输出信息**
```bash
aws cloudformation describe-stacks \
  --stack-name hands-on-training \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

5. **SSH 到 EC2 并部署应用**
```bash
# 获取 EC2 IP
EC2_IP=$(aws cloudformation describe-stacks \
  --stack-name hands-on-training \
  --query 'Stacks[0].Outputs[?OutputKey==`EC2PublicIP`].OutputValue' \
  --output text \
  --region us-east-1)

# 上传代码
scp -i hands-on-training-key.pem -r ../backend ../frontend ec2-user@$EC2_IP:/tmp/
scp -i hands-on-training-key.pem -r ../scripts ec2-user@$EC2_IP:/tmp/

# SSH 登录
ssh -i hands-on-training-key.pem ec2-user@$EC2_IP

# 在 EC2 上执行
sudo mv /tmp/backend /tmp/frontend /tmp/scripts /opt/hands-on-training/
cd /opt/hands-on-training
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

### 方式二：手动部署

1. **创建 RDS 数据库**
```bash
aws rds create-db-instance \
  --db-instance-identifier hands-on-training-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --region us-east-1
```

2. **启动 EC2 实例**
```bash
aws ec2 run-instances \
  --image-id ami-xxxxx \
  --instance-type t3.small \
  --key-name hands-on-training-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --region us-east-1
```

3. **配置环境变量**

在 EC2 上创建 `/opt/hands-on-training/backend/.env`:
```
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=hands_on_training
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123
JWT_SECRET=your-jwt-secret
PORT=3000
```

4. **执行部署脚本**
```bash
./scripts/deploy-ec2.sh
```

## 验证部署

1. **检查后端服务**
```bash
curl http://$EC2_IP/api/health
```

2. **访问前端**
```
http://$EC2_IP
```

3. **查看日志**
```bash
pm2 logs hands-on-backend
```

## 更新应用

```bash
# SSH 到 EC2
ssh -i hands-on-training-key.pem ec2-user@$EC2_IP

# 更新代码
cd /opt/hands-on-training/backend
git pull  # 或上传新代码
npm install
pm2 restart hands-on-backend

# 更新前端
cd /opt/hands-on-training/frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 监控和维护

```bash
# 查看 PM2 状态
pm2 status

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看系统资源
htop

# 查看数据库连接
psql -h $DB_HOST -U postgres -d hands_on_training
```

## 清理资源

```bash
aws cloudformation delete-stack \
  --stack-name hands-on-training \
  --region us-east-1
```

## 安全建议

- 使用 HTTPS（配置 SSL 证书）
- 限制 SSH 访问 IP
- 定期更新系统和依赖
- 启用 RDS 自动备份
- 使用 AWS Secrets Manager 存储敏感信息
- 配置 CloudWatch 告警
