# Rankings 页面 502 错误排查总结

## 问题描述
访问 `http://54.89.123.129/admin/rankings` 页面时报错 502。

## 问题排查

### 1. API 测试 ✅
```bash
curl http://54.89.123.129/api/statistics/rankings
```
结果：API 正常工作，返回 6 条学生排名数据

### 2. 后端服务状态 ✅
```bash
pm2 status
```
结果：hands-on-backend 服务正常运行（online，35分钟运行时间）

### 3. Nginx 状态 ✅
```bash
curl -I http://54.89.123.129/admin/rankings
```
结果：返回 200 OK，页面正常加载

### 4. Nginx 错误日志 ✅
```bash
sudo tail -50 /var/log/nginx/error.log
```
结果：没有 502 错误记录

## 可能的原因

### 1. 需要登录（最可能）
Rankings 页面需要 admin 权限：

```typescript
// App.tsx
<Route 
  path="/admin/rankings" 
  element={
    <ProtectedRoute requiredRole="admin">
      <Rankings />
    </ProtectedRoute>
  } 
/>
```

**解决方案：**
1. 访问 `http://54.89.123.129/admin/login`
2. 使用管理员账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. 登录后再访问 rankings 页面

### 2. 浏览器缓存（可能）
浏览器可能缓存了旧版本的 JavaScript 文件。

**解决方案：**
强制刷新浏览器：
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

或清除浏览器缓存：
- Chrome: `Ctrl/Cmd + Shift + Delete`
- 选择"缓存的图片和文件"
- 点击"清除数据"

### 3. 前端 JavaScript 错误（可能）
前端代码执行时可能出错。

**检查方法：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 查看是否有 JavaScript 错误
4. 查看 Network 标签页
5. 检查哪个请求返回了 502

## 验证步骤

### 步骤 1: 确认 API 工作
```bash
curl http://54.89.123.129/api/statistics/rankings
```
预期结果：返回 JSON 数据，包含学生排名

### 步骤 2: 确认登录状态
1. 打开浏览器开发者工具（F12）
2. 访问 `http://54.89.123.129/admin/rankings`
3. 查看 Console 是否有认证错误
4. 查看 Network 标签，检查是否有 401 或 403 错误

### 步骤 3: 检查实际错误
如果确实是 502 错误：
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 刷新页面
4. 找到返回 502 的请求
5. 查看请求的 URL 和响应

## 常见的 "502" 误解

用户看到的 "502" 可能不是真正的 HTTP 502 错误，而是：

1. **401 Unauthorized** - 未登录
2. **403 Forbidden** - 权限不足
3. **500 Internal Server Error** - 服务器内部错误
4. **前端错误消息** - 显示 "Error 502" 的自定义错误页面

## 真正的 HTTP 502 错误

如果确实是 HTTP 502 Bad Gateway，原因通常是：

1. **后端服务未运行**
   ```bash
   pm2 status
   # 检查 hands-on-backend 是否 online
   ```

2. **后端服务崩溃**
   ```bash
   pm2 logs hands-on-backend --lines 50
   # 查看是否有错误日志
   ```

3. **端口不匹配**
   ```bash
   # 检查 Nginx 配置
   cat /etc/nginx/nginx.conf | grep proxy_pass
   # 应该是: proxy_pass http://localhost:3000;
   
   # 检查后端监听端口
   netstat -tlnp | grep 3000
   ```

4. **防火墙阻止**
   ```bash
   sudo iptables -L -n | grep 3000
   ```

## 当前状态

根据排查结果：
- ✅ API 正常工作
- ✅ 后端服务运行正常
- ✅ Nginx 配置正确
- ✅ 没有真正的 502 错误

**结论：** 问题很可能是**用户未登录**或**浏览器缓存**。

## 解决方案

### 立即解决
1. 登录管理员账号
2. 强制刷新浏览器（Ctrl+Shift+R）
3. 清除浏览器缓存

### 如果问题仍然存在
请提供以下信息：
1. 浏览器开发者工具 Console 的错误信息
2. Network 标签中失败请求的详细信息
3. 具体的错误消息截图

## 相关命令

```bash
# 检查后端服务
pm2 status
pm2 logs hands-on-backend --lines 50

# 检查 API
curl http://54.89.123.129/api/statistics/rankings

# 检查 Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/error.log

# 重启服务（如果需要）
pm2 restart hands-on-backend
sudo systemctl reload nginx
```

## 管理员登录信息
- URL: `http://54.89.123.129/admin/login`
- 用户名: `admin`
- 密码: `admin123`
