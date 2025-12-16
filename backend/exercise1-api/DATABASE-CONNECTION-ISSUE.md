# 数据库连接问题解决方案

## 🔍 问题诊断

根据测试结果，发现以下问题：

1. ✅ **API服务器运行正常** - 端口3001可访问
2. ❌ **数据库连接失败** - PostgreSQL服务未运行
3. ❌ **学员注册失败** - 返回500错误，原因是数据库连接问题

## 🛠️ 解决步骤

### 1. 启动PostgreSQL服务

```bash
# 方式1: 使用Homebrew启动PostgreSQL
brew services start postgresql@14

# 或者如果是其他版本
brew services start postgresql

# 方式2: 手动启动PostgreSQL
pg_ctl -D /usr/local/var/postgres start

# 方式3: 使用系统服务启动
sudo systemctl start postgresql
```

### 2. 验证PostgreSQL服务状态

```bash
# 检查PostgreSQL服务状态
brew services list | grep postgres

# 或者检查进程
ps aux | grep postgres

# 测试连接
psql -h localhost -U postgres -d postgres
```

### 3. 检查数据库是否存在

```bash
# 连接到PostgreSQL
psql -h localhost -U postgres

# 列出所有数据库
\l

# 查找hands_on_training数据库
\l hands_on_training
```

### 4. 创建数据库（如果不存在）

```bash
# 连接到PostgreSQL
psql -h localhost -U postgres

# 创建数据库
CREATE DATABASE hands_on_training;

# 退出
\q
```

### 5. 运行数据库迁移

```bash
# 在exercise1-api目录中
cd exercise1-api

# 运行数据库schema
psql -h localhost -U postgres -d hands_on_training -f ../backend/src/database/schema.sql
```

### 6. 测试数据库连接

```bash
# 测试连接
npm run test-connection

# 应该看到类似输出：
# ✅ 数据库连接成功: 2025-12-15T14:32:00.000Z
```

### 7. 重新运行API测试

```bash
# Node.js测试
npm run test

# Python测试
python3 test-api.py
```

## 🔧 常见问题解决

### 问题1: PostgreSQL未安装

```bash
# 安装PostgreSQL
brew install postgresql@14

# 启动服务
brew services start postgresql@14
```

### 问题2: 权限问题

```bash
# 检查PostgreSQL数据目录权限
ls -la /usr/local/var/postgres

# 如果权限有问题，修复权限
sudo chown -R $(whoami) /usr/local/var/postgres
```

### 问题3: 端口被占用

```bash
# 检查5432端口
lsof -i :5432

# 如果被占用，杀死进程或更改端口
sudo kill -9 <PID>
```

### 问题4: 数据库用户问题

```bash
# 创建postgres用户（如果不存在）
createuser -s postgres

# 或者使用当前用户
psql -d postgres -c "CREATE USER postgres WITH SUPERUSER;"
```

## 📋 验证清单

完成以下步骤后，确认所有项目都正常：

- [ ] PostgreSQL服务正在运行
- [ ] hands_on_training数据库存在
- [ ] 数据库连接测试通过
- [ ] API健康检查通过
- [ ] 学员注册测试通过
- [ ] 完整API测试通过

## 🚀 快速验证命令

```bash
# 1. 启动PostgreSQL
brew services start postgresql@14

# 2. 测试数据库连接
npm run test-connection

# 3. 运行API测试
python3 test-api.py
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. PostgreSQL版本：`postgres --version`
2. 服务状态：`brew services list | grep postgres`
3. 错误日志：PostgreSQL日志文件内容
4. 系统信息：操作系统版本

## 🔗 相关文档

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [Homebrew PostgreSQL安装指南](https://wiki.postgresql.org/wiki/Homebrew)
- [项目故障排除指南](./TROUBLESHOOTING.md)