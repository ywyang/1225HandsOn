# AWS 部署总结

## 已创建的文件

1. **scripts/cloudformation.yaml** - CloudFormation 基础设施模板
   - VPC 和子网配置
   - EC2 实例（t3.small）
   - RDS PostgreSQL 数据库（db.t3.micro）
   - 安全组和 IAM 角色

2. **scripts/deploy-ec2.sh** - EC2 服务器部署脚本
   - 安装 Node.js、PostgreSQL、Nginx
   - 配置 PM2 进程管理
   - 部署前后端应用

3. **scripts/nginx.conf** - Nginx 配置
   - 前端静态文件服务
   - 后端 API 反向代理

4. **scripts/quick-deploy.sh** - 一键部署脚本
   - 自动创建 Key Pair
   - 部署 CloudFormation Stack
   - 输出连接信息

5. **docs/AWS_DEPLOYMENT.md** - 详细部署文档

## 快速开始

### 一键部署（推荐）

```bash
cd /Users/yangyuewei/demosrc/KIRO-demo/1225HandsOn/backend
./scripts/quick-deploy.sh
```

### 手动部署步骤

1. **部署基础设施**
```bash
aws cloudformation create-stack \
  --stack-name hands-on-training \
  --template-body file://scripts/cloudformation.yaml \
  --parameters \
    ParameterKey=KeyName,ParameterValue=your-key \
    ParameterKey=DBPassword,ParameterValue=YourPassword123 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

2. **等待完成**
```bash
aws cloudformation wait stack-create-complete \
  --stack-name hands-on-training \
  --region us-east-1
```

3. **获取 EC2 IP**
```bash
aws cloudformation describe-stacks \
  --stack-name hands-on-training \
  --query 'Stacks[0].Outputs[?OutputKey==`EC2PublicIP`].OutputValue' \
  --output text
```

4. **上传代码到 EC2**
```bash
scp -i your-key.pem -r backend frontend scripts ec2-user@<EC2_IP>:/tmp/
```

5. **SSH 登录并部署**
```bash
ssh -i your-key.pem ec2-user@<EC2_IP>
sudo mv /tmp/{backend,frontend,scripts} /opt/hands-on-training/
cd /opt/hands-on-training
./scripts/deploy-ec2.sh
```

## 架构说明

```
Internet
    |
    v
[EC2 Instance]
    |-- Nginx (Port 80) --> Frontend (React)
    |-- Node.js (Port 3000) --> Backend API
    |
    v
[RDS PostgreSQL]
    |-- Database: hands_on_training
```

## 访问信息

- **前端**: http://<EC2_IP>
- **后端 API**: http://<EC2_IP>/api
- **健康检查**: http://<EC2_IP>/health
- **管理员登录**: admin / admin123

## 成本估算（us-east-1）

- EC2 t3.small: ~$15/月
- RDS db.t3.micro: ~$15/月
- 数据传输: ~$5/月
- **总计**: ~$35/月

## 后续优化

1. **配置 HTTPS**
   - 使用 AWS Certificate Manager
   - 配置 Application Load Balancer

2. **自动扩展**
   - 配置 Auto Scaling Group
   - 添加多个 EC2 实例

3. **监控告警**
   - CloudWatch 日志和指标
   - SNS 告警通知

4. **备份策略**
   - RDS 自动备份
   - 定期快照

5. **CI/CD**
   - GitHub Actions
   - AWS CodePipeline

## 故障排查

```bash
# 检查后端服务
pm2 status
pm2 logs hands-on-backend

# 检查 Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# 检查数据库连接
psql -h <RDS_ENDPOINT> -U postgres -d hands_on_training

# 查看系统资源
htop
df -h
```

## 清理资源

```bash
aws cloudformation delete-stack \
  --stack-name hands-on-training \
  --region us-east-1
```
