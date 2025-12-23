# API 错误修复总结

## 问题描述
访问 `http://54.89.123.129/student` 时显示 "API Error"，页面无法加载练习列表。

## 根本原因
后端服务的 `.env` 配置文件中数据库连接指向 `localhost:5432`，但实际数据库部署在 AWS RDS 上。

错误日志：
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

## 原因分析
部署时使用的是开发环境的 `.env` 文件，其中：
- `DB_HOST=localhost`
- `DB_PASSWORD=postgres`

但生产环境应该连接到：
- `DB_HOST=hands-on-training-db.crjsnxsa4ld1.us-east-1.rds.amazonaws.com`
- `DB_PASSWORD=7KYy1ihPlWQX8l4Rp1OxNQ==`

## 解决方案
更新 EC2 服务器上的 `/opt/hands-on-training/backend/.env` 文件：

```bash
# Database Configuration
DB_HOST=hands-on-training-db.crjsnxsa4ld1.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=hands_on_training
DB_USER=postgres
DB_PASSWORD=7KYy1ihPlWQX8l4Rp1OxNQ==

# Database URL
DATABASE_URL=postgresql://postgres:7KYy1ihPlWQX8l4Rp1OxNQ==@hands-on-training-db.crjsnxsa4ld1.us-east-1.rds.amazonaws.com:5432/hands_on_training
```

然后重启后端服务：
```bash
pm2 restart hands-on-backend --update-env
```

## 验证结果
✅ API 连接成功
✅ 练习列表正常加载
✅ 数据库查询正常执行

测试命令：
```bash
curl http://54.89.123.129/api/exercises
```

返回 6 个练习记录，状态码 200。

## 相关文件
- `/opt/hands-on-training/backend/.env` - 后端环境变量配置
- PM2 进程：`hands-on-backend`

## 注意事项
- 使用 `pm2 restart --update-env` 确保环境变量更新生效
- 生产环境应该使用 `NODE_ENV=production`
- 密码等敏感信息应该使用 AWS Secrets Manager 管理

## 后续建议
1. 创建部署脚本自动配置正确的环境变量
2. 使用 AWS Systems Manager Parameter Store 或 Secrets Manager 存储敏感配置
3. 添加数据库连接健康检查
