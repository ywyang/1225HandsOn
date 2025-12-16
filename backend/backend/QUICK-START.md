# 快速启动指南

## 🚀 快速开始 (无数据库)

如果您想快速测试API功能，可以使用内存存储版本：

```bash
# 1. 安装依赖
npm install

# 2. 启动测试服务器 (使用内存存储)
npm run start:exercise1

# 3. 测试API
npm run test:api

# 4. 运行学员示例
export STUDENT_NAME="张三"
npm run example
```

服务器将在 `http://localhost:3000` 启动。

## 🗄️ 完整版本 (使用数据库)

### 1. 环境准备

**安装PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS (使用Homebrew)
brew install postgresql
brew services start postgresql

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

### 2. 数据库配置

```bash
# 连接到PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE training_system;
CREATE USER training_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE training_system TO training_user;
\q
```

### 3. 应用配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

更新 `.env` 文件中的数据库配置：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_system
DB_USER=training_user
DB_PASSWORD=secure_password
```

### 4. 初始化数据库

```bash
# 创建数据库表和初始数据
npm run setup
```

### 5. 启动应用

```bash
# 开发模式 (自动重启)
npm run dev

# 生产模式
npm start
```

## 📋 验证安装

### 1. 检查API健康状态
```bash
curl http://localhost:3000/health
```

### 2. 运行API测试
```bash
npm run test:api
```

### 3. 运行学员示例程序
```bash
export STUDENT_NAME="测试学员"
npm run example
```

## 🔧 常见问题

### Q: 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U training_user -d training_system
```

### Q: 端口被占用
```bash
# 查看端口使用情况
sudo netstat -tlnp | grep :3000

# 更改端口
export PORT=3001
npm start
```

### Q: 权限错误
```bash
# 确保数据库用户有正确权限
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE training_system TO training_user;"
```

## 📚 API文档

启动服务器后，访问以下地址查看API信息：
- API概览: `http://localhost:3000/api`
- 健康检查: `http://localhost:3000/health`

详细API文档请参考: `README-EXERCISE1.md`

## 🎯 学员使用

学员可以参考以下文档开始编程：
- 详细指南: `../docs/EXERCISE-1-INSTRUCTIONS.md`
- 快速参考: `../docs/QUICK-REFERENCE.md`
- 学员版说明: `../docs/STUDENT-EXERCISE-1.md`

## 🔒 生产环境部署

生产环境部署请参考: `DEPLOYMENT-GUIDE.md`

---

**需要帮助？** 查看完整文档或联系技术支持。