# Hands-on Exercise 1 部署指南

## 快速开始

### 1. 启动测试服务器

使用内存存储的简化版本（适合快速测试）：

```bash
cd backend
npm run start:exercise1
```

服务器将在 `http://localhost:3000` 启动。

### 2. 测试API功能

运行自动化测试：

```bash
npm run test:api
```

### 3. 运行学员示例程序

```bash
# 设置学员姓名
export STUDENT_NAME="张三"

# 运行示例程序
npm run example
```

## 完整部署

### 1. 环境准备

**系统要求**:
- Node.js 18+ 
- PostgreSQL 12+
- 至少 1GB RAM
- 10GB 磁盘空间

**安装依赖**:
```bash
# 安装Node.js依赖
npm install

# 安装PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 安装PostgreSQL (CentOS/RHEL)
sudo yum install postgresql-server postgresql-contrib
```

### 2. 数据库配置

**创建数据库**:
```sql
-- 连接到PostgreSQL
sudo -u postgres psql

-- 创建数据库和用户
CREATE DATABASE training_system;
CREATE USER training_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE training_system TO training_user;
```

**环境变量配置**:
```bash
# 创建 .env 文件
cat > .env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_system
DB_USER=training_user
DB_PASSWORD=secure_password

# 服务器配置
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here

# API配置
API_BASE_URL=http://your-domain.com/api
EOF
```

**运行数据库迁移**:
```bash
npm run migrate
```

### 3. 生产环境部署

**使用PM2进程管理器**:
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start src/index.js --name "training-api"

# 设置开机自启
pm2 startup
pm2 save
```

**使用Docker部署**:
```bash
# 构建镜像
docker build -t hands-on-training .

# 运行容器
docker run -d \
  --name training-api \
  -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  hands-on-training
```

### 4. Nginx反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## AWS部署

### 1. EC2实例配置

**启动EC2实例**:
- 实例类型: t3.micro (免费套餐) 或 t3.small
- AMI: Amazon Linux 2 或 Ubuntu 20.04 LTS
- 安全组: 开放端口 22 (SSH), 80 (HTTP), 443 (HTTPS)

**安装运行环境**:
```bash
# Amazon Linux 2
sudo yum update -y
sudo yum install -y nodejs npm git postgresql

# Ubuntu
sudo apt update
sudo apt install -y nodejs npm git postgresql-client
```

### 2. RDS数据库配置

**创建RDS实例**:
- 引擎: PostgreSQL
- 实例类别: db.t3.micro
- 存储: 20GB GP2
- 多可用区: 否 (开发环境)

**安全组配置**:
- 入站规则: PostgreSQL (5432) 来源为EC2安全组

### 3. 应用部署

```bash
# 克隆代码
git clone <your-repo-url>
cd hands-on-training-system/backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置RDS连接信息

# 运行数据库迁移
npm run migrate

# 启动应用
pm2 start src/index.js --name "training-api"
```

### 4. 负载均衡器配置

**Application Load Balancer**:
- 监听器: HTTP:80, HTTPS:443
- 目标组: EC2实例端口3000
- 健康检查: /health

## 监控和日志

### 1. 应用监控

**PM2监控**:
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs training-api

# 监控资源使用
pm2 monit
```

**健康检查**:
```bash
# 检查API健康状态
curl http://localhost:3000/health

# 检查数据库连接
curl http://localhost:3000/api
```

### 2. 日志管理

**日志轮转配置**:
```bash
# 安装logrotate配置
sudo tee /etc/logrotate.d/training-api << EOF
/home/ec2-user/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 3. 性能监控

**CloudWatch配置** (AWS):
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络流量
- 应用错误率

## 安全配置

### 1. 防火墙设置

```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL证书配置

**使用Let's Encrypt**:
```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 数据库安全

- 使用强密码
- 限制数据库访问IP
- 启用SSL连接
- 定期备份数据

## 故障排除

### 1. 常见问题

**端口占用**:
```bash
# 查看端口使用情况
sudo netstat -tlnp | grep :3000

# 杀死占用进程
sudo kill -9 <PID>
```

**数据库连接失败**:
```bash
# 测试数据库连接
psql -h <host> -U <user> -d <database>

# 检查防火墙规则
sudo iptables -L
```

**内存不足**:
```bash
# 查看内存使用
free -h

# 添加swap空间
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 2. 日志分析

**应用日志**:
```bash
# PM2日志
pm2 logs training-api --lines 100

# 系统日志
sudo journalctl -u training-api -f
```

**数据库日志**:
```bash
# PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 备份和恢复

### 1. 数据库备份

```bash
# 创建备份
pg_dump -h <host> -U <user> -d training_system > backup_$(date +%Y%m%d).sql

# 自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/training_system_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到crontab
crontab -e
# 添加: 0 2 * * * /home/ec2-user/backup.sh
```

### 2. 应用备份

```bash
# 备份应用代码和配置
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  /path/to/app \
  /home/ec2-user/.env \
  /etc/nginx/sites-available/training-api
```

## 扩展和优化

### 1. 性能优化

- 启用Gzip压缩
- 配置缓存策略
- 数据库索引优化
- 连接池配置

### 2. 高可用性

- 多实例部署
- 数据库主从复制
- 负载均衡配置
- 自动故障转移

---

**支持联系**: 如需技术支持，请查看日志文件并提供详细的错误信息。