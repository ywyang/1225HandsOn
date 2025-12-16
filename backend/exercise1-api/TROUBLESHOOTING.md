# 数据库写入问题排查指南

## 问题描述
API接口返回成功，但数据没有写入到数据库表submissions中。

## 可能的原因和解决方案

### 0. 服务器未启动 (404错误)

**症状**: Python测试返回 `POST http://localhost:3001/api/submissions/exercise1状态码: 404响应: {"error": "Route not found"}`

**检查步骤:**
```bash
# 快速检查服务器状态
npm run check-server
# 或使用Python版本
python quick-check.py
```

**解决方案:**
```bash
# 1. 启动服务器
npm start

# 2. 如果端口被占用，检查并杀死进程
netstat -tlnp | grep :3001
sudo kill -9 <PID>

# 3. 或者使用不同端口
export PORT=3001
npm start

# 4. 验证服务器启动
npm run check-server
```

### 1. 数据库连接问题

**检查步骤:**
```bash
# 测试数据库连接
npm run test-connection
```

**常见问题:**
- 数据库名称不匹配 (应该是 `hands_on_training` 而不是 `training_system`)
- 数据库用户名/密码错误
- PostgreSQL服务未启动

**解决方案:**
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 启动PostgreSQL服务
sudo systemctl start postgresql

# 检查数据库是否存在
psql -h localhost -U postgres -l
```

### 2. 表结构问题

**检查步骤:**
```bash
# 检查表结构
npm run check-db
```

**可能问题:**
- submissions表不存在
- 表结构缺少必要字段 (elastic_ip_address, screenshot_data等)

**解决方案:**
```bash
# 运行数据库迁移
psql -h localhost -U postgres -d hands_on_training -f ../backend/src/database/schema.sql
```

### 3. 事务问题

**检查步骤:**
```bash
# 运行完整的数据库写入测试
npm run test-db-write
```

**可能问题:**
- 事务回滚
- 约束违反
- 数据类型不匹配

### 4. 权限问题

**检查步骤:**
```sql
-- 检查用户权限
\du postgres

-- 检查表权限
\dp submissions
```

**解决方案:**
```sql
-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

## 调试工具

### 1. 连接测试
```bash
npm run test-connection
```

### 2. 表结构检查
```bash
npm run check-db
```

### 3. 完整数据库调试
```bash
npm run debug-db
```

### 4. API写入测试
```bash
npm run test-db-write
```

## 环境配置

确保 `.env` 文件配置正确:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hands_on_training
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3001
NODE_ENV=development
```

## 常见错误信息

### "relation 'submissions' does not exist"
- 表不存在，需要运行数据库迁移

### "password authentication failed"
- 数据库密码错误，检查 `.env` 配置

### "database 'hands_on_training' does not exist"
- 数据库不存在，需要创建数据库

### "column 'elastic_ip_address' does not exist"
- 表结构过旧，需要运行迁移脚本

## 解决步骤

1. **检查数据库连接**
   ```bash
   npm run test-connection
   ```

2. **检查表结构**
   ```bash
   npm run check-db
   ```

3. **运行数据库迁移** (如果需要)
   ```bash
   psql -h localhost -U postgres -d hands_on_training -f ../backend/src/database/schema.sql
   ```

4. **测试API写入**
   ```bash
   npm run test-db-write
   ```

5. **启动服务器**
   ```bash
   npm start
   ```

## 联系支持

如果问题仍然存在，请提供以下信息:
- 错误日志
- 数据库连接测试结果
- 表结构检查结果
- 环境配置信息