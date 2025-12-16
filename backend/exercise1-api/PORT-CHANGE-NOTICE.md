# 端口更改通知

## 📢 重要更新

Exercise 1 API服务器的默认端口已从 **3000** 更改为 **3001**。

### 🔄 更改内容

- **旧端口**: `http://localhost:3000`
- **新端口**: `http://localhost:3001`

### 📝 已更新的文件

以下文件已更新为使用新端口：

#### 配置文件
- `.env` - 环境配置
- `.env.example` - 环境配置示例
- `server.js` - 服务器主文件

#### 测试文件
- `test-api.js` - Node.js API测试
- `test-api.py` - Python API测试
- `test-avatar-storage.js` - 头像存储测试
- `test-avatar-storage.py` - Python头像存储测试
- `test-screenshot.js` - 截图测试
- `test-database-write.js` - 数据库写入测试
- `check-server.js` - 服务器检查
- `start-server.js` - 服务器启动脚本
- `quick-check.py` - 快速检查脚本

#### 示例文件
- `student-example.js` - Node.js学员示例
- `student-example.py` - Python学员示例

#### 文档文件
- `README.md` - 项目说明
- `CLIENT-DEVELOPMENT-GUIDE.md` - 客户端开发指南
- `PYTHON-GUIDE.md` - Python使用指南
- `EXERCISE-INSTRUCTIONS.md` - 练习说明
- `SCREENSHOT-FEATURE.md` - 截图功能说明
- `TROUBLESHOOTING.md` - 故障排除指南
- `STARTUP-GUIDE.md` - 启动指南

### 🚀 使用新端口

#### 启动服务器
```bash
npm start
# 服务器将在 http://localhost:3001 启动
```

#### 测试API
```bash
# Node.js测试
npm run test

# Python测试
python test-api.py

# 快速检查
python quick-check.py
```

#### 访问API
```bash
# 健康检查
curl http://localhost:3001/health

# API信息
curl http://localhost:3001/api
```

### ⚠️ 注意事项

1. **客户端代码**: 如果你有自定义的客户端代码，请更新API地址为 `http://localhost:3001`

2. **环境变量**: 如果使用环境变量 `API_BASE_URL`，请更新为新端口：
   ```bash
   export API_BASE_URL="http://localhost:3001/api"
   ```

3. **防火墙设置**: 如果有防火墙规则，请确保端口3001已开放

4. **代理配置**: 如果使用代理服务器，请更新代理配置

### 🔧 自定义端口

如果需要使用其他端口，可以通过环境变量设置：

```bash
# 使用端口3002
export PORT=3002
npm start

# 或者在.env文件中设置
echo "PORT=3002" >> .env
npm start
```

### 📞 获取帮助

如果遇到端口相关问题，请：

1. 检查端口是否被占用：
   ```bash
   netstat -tlnp | grep :3001
   ```

2. 运行服务器检查：
   ```bash
   npm run check-server
   ```

3. 查看启动指南：[STARTUP-GUIDE.md](./STARTUP-GUIDE.md)

4. 查看故障排除：[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)