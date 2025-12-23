# SQL Query 功能 404 错误修复总结

## 问题描述
访问 `http://54.89.123.129/admin/sql-query` 时，前端报错 "Request failed with status code 404"，SQL 相关的 API 端点无法访问。

## 根本原因
发现了两个问题：

### 1. SQL 路由使用了独立的数据库连接池（已修复）
`src/routes/sql.js` 文件中创建了自己的 PostgreSQL 连接池，配置默认指向 `localhost:5432`，而不是使用统一的 RDS 数据库配置。

**修复方案：**
将 SQL 路由改为使用 `src/config/database.js` 中的统一数据库连接：
```javascript
// 修改前
import { Pool } from 'pg';
const pool = new Pool({ host: 'localhost', ... });

// 修改后
import { getClient } from '../config/database.js';
const client = await getClient();
```

### 2. index.js 缺少 SQL 路由注册（主要问题）
PM2 启动的是 `src/index.js` 而不是 `src/app.js`，但 `index.js` 文件中**没有导入和注册 SQL 路由**。

**问题代码：**
```javascript
// index.js 中只导入了 4 个路由
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import submissionRoutes from './routes/submissions.js';
import statisticsRoutes from './routes/statistics.js';
// 缺少: import sqlRoutes from './routes/sql.js';

// 只注册了 4 个路由
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/statistics', statisticsRoutes);
// 缺少: app.use('/api/sql', sqlRoutes);
```

## 解决方案

### 修改文件
1. `src/routes/sql.js` - 使用统一的数据库配置
2. `src/index.js` - 添加 SQL 路由的导入和注册

### 部署步骤
```bash
# 1. 上传修复后的文件
scp -i ~/ec2world/us-east-1.pem src/routes/sql.js ec2-user@54.89.123.129:/tmp/
scp -i ~/ec2world/us-east-1.pem src/index.js ec2-user@54.89.123.129:/tmp/

# 2. SSH 到服务器
ssh -i ~/ec2world/us-east-1.pem ec2-user@54.89.123.129

# 3. 替换文件
sudo mv /tmp/sql.js /opt/hands-on-training/backend/src/routes/sql.js
sudo mv /tmp/index.js /opt/hands-on-training/backend/src/index.js
sudo chown ec2-user:ec2-user /opt/hands-on-training/backend/src/routes/sql.js
sudo chown ec2-user:ec2-user /opt/hands-on-training/backend/src/index.js

# 4. 重启后端
pm2 restart hands-on-backend
```

## 验证结果
✅ SQL API 端点正常工作：
- `GET /api/sql/schema` - 返回数据库表结构
- `GET /api/sql/samples` - 返回示例查询
- `POST /api/sql/execute` - 执行 SQL 查询

测试命令：
```bash
curl http://54.89.123.129/api/sql/schema
curl http://54.89.123.129/api/sql/samples
```

## 经验教训
1. **检查实际运行的入口文件**：PM2 启动的是 `index.js`，而不是 `app.js`
2. **保持代码一致性**：`index.js` 和 `app.js` 应该保持路由注册的一致性
3. **使用统一的数据库配置**：避免在不同模块中创建独立的数据库连接
4. **测试环境变量加载**：确保 PM2 正确加载了环境变量（使用 `--update-env`）

## 相关文件
- `/opt/hands-on-training/backend/src/index.js` - 主入口文件
- `/opt/hands-on-training/backend/src/routes/sql.js` - SQL 查询路由
- `/opt/hands-on-training/backend/src/config/database.js` - 统一数据库配置
- `/opt/hands-on-training/backend/.env` - 环境变量配置

## 后续建议
1. 考虑合并 `index.js` 和 `app.js`，避免维护两份类似的代码
2. 添加启动时的路由注册日志，方便排查问题
3. 添加自动化测试验证所有 API 端点
