# Exercise 1 API 启动指南

## 🚀 快速启动

### 1. 检查环境

```bash
# 确保在exercise1-api目录中
cd exercise1-api

# 检查Node.js版本
node --version

# 检查npm版本
npm --version
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境

确保 `.env` 文件存在并配置正确：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hands_on_training
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3001
NODE_ENV=development
```

### 4. 测试数据库连接

```bash
npm run test-connection
```

### 5. 启动服务器

#### 方式1: 简单启动
```bash
npm start
```

#### 方式2: 带验证的启动
```bash
npm run start-with-check
```

#### 方式3: 开发模式 (自动重启)
```bash
npm run dev
```

### 6. 验证服务器

#### Node.js版本
```bash
npm run check-server
```

#### Python版本
```bash
python quick-check.py
```

## 🔍 故障排除

### 问题1: 404错误 "Route not found"

**症状**: Python测试返回404错误

**可能原因**:
1. 服务器没有启动
2. 端口被占用
3. 路由配置错误

**解决步骤**:

```bash
# 1. 检查服务器状态
npm run check-server

# 2. 如果服务器没运行，启动它
npm start

# 3. 检查端口占用
netstat -tlnp | grep :3001

# 4. 如果端口被占用，杀死进程或更改端口
export PORT=3001
npm start
```

### 问题2: 数据库连接失败

**症状**: 服务器启动失败，数据库连接错误

**解决步骤**:

```bash
# 1. 测试数据库连接
npm run test-connection

# 2. 检查PostgreSQL服务
sudo systemctl status postgresql

# 3. 启动PostgreSQL服务
sudo systemctl start postgresql

# 4. 检查数据库是否存在
psql -h localhost -U postgres -l
```

### 问题3: 依赖缺失

**症状**: 模块找不到错误

**解决步骤**:

```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 📋 测试流程

### 完整测试流程

```bash
# 1. 启动服务器
npm start

# 2. 在另一个终端中运行测试
npm run test

# 3. 运行Python测试
python test-api.py

# 4. 测试数据库写入
npm run test-db-write
```

### 单独测试组件

```bash
# 测试数据库连接
npm run test-connection

# 测试服务器状态
npm run check-server

# 测试数据库结构
npm run check-db

# 调试数据库
npm run debug-db
```

## 🎯 常用命令

```bash
# 启动相关
npm start                 # 启动服务器
npm run dev              # 开发模式启动
npm run start-with-check # 带验证启动

# 测试相关
npm run test             # Node.js API测试
npm run check-server     # 服务器状态检查
npm run test-connection  # 数据库连接测试
npm run test-db-write    # 数据库写入测试

# 调试相关
npm run debug-db         # 数据库调试
npm run check-db         # 数据库结构检查

# 示例相关
npm run example          # 运行学员示例
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **错误信息**: 完整的错误日志
2. **环境信息**: Node.js版本、操作系统
3. **测试结果**: 
   ```bash
   npm run check-server
   npm run test-connection
   ```
4. **服务器日志**: 启动服务器时的输出信息

## 🔗 相关文档

- [README.md](./README.md) - 项目概述
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 详细故障排除
- [CLIENT-DEVELOPMENT-GUIDE.md](./CLIENT-DEVELOPMENT-GUIDE.md) - 客户端开发指南
- [PYTHON-GUIDE.md](./PYTHON-GUIDE.md) - Python使用指南