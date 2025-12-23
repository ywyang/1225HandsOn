# 前端文件未同步到 Nginx 目录问题修复总结

## 问题描述
"Hands-on Exercise 1" 和其他练习无法 unpublish，即使 API 工作正常，前端也已修复并重新构建。

## 问题排查

### 1. API 测试 ✅
```bash
curl -X PUT http://54.89.123.129/api/exercises/056909cc-7bf3-4617-b484-455cbbb8ac7d/unpublish
```
结果：API 正常，返回 `isPublished: false`

### 2. 前端构建检查 ✅
```bash
ls /opt/hands-on-training/frontend/dist/assets/*.js
# -rw-rw-r-- 1 ec2-user ec2-user 319K Dec 22 14:05 index-C0kqIOp-.js
```
结果：最新构建文件存在

### 3. HTML 文件检查 ❌
```bash
# 浏览器看到的
curl http://54.89.123.129/ | grep index
# <script src="/assets/index-D44P2E3m.js"></script>  ← 旧文件

# 服务器上构建的
cat /opt/hands-on-training/frontend/dist/index.html | grep index
# <script src="/assets/index-C0kqIOp-.js"></script>  ← 新文件
```

## 根本原因

**Nginx 配置指向了错误的目录！**

```nginx
# /etc/nginx/nginx.conf
location / {
    root /var/www/html;  # ❌ 指向旧目录
    try_files $uri $uri/ /index.html;
}
```

实际情况：
- 前端构建输出：`/opt/hands-on-training/frontend/dist/`
- Nginx 服务目录：`/var/www/html/`
- 问题：构建后的文件没有复制到 Nginx 目录

### 时间线
1. 12月21日 12:10 - 最后一次复制文件到 `/var/www/html/`
2. 12月22日 13:42 - 修复代码并重新构建到 `/opt/hands-on-training/frontend/dist/`
3. 12月22日 14:05 - 再次修复并重新构建
4. **问题**：构建后忘记复制文件到 Nginx 目录

## 解决方案

### 临时方案（已执行）
```bash
# 复制最新构建文件到 Nginx 目录
sudo rm -rf /var/www/html/*
sudo cp -r /opt/hands-on-training/frontend/dist/* /var/www/html/
sudo chown -R nginx:nginx /var/www/html/
sudo systemctl reload nginx
```

### 永久方案（推荐）

#### 方案 1: 修改 Nginx 配置（推荐）
直接让 Nginx 指向构建目录：

```nginx
# /etc/nginx/nginx.conf
location / {
    root /opt/hands-on-training/frontend/dist;  # ✅ 直接指向构建目录
    try_files $uri $uri/ /index.html;
}
```

优点：
- 构建后立即生效，无需复制
- 减少部署步骤
- 避免文件不同步

#### 方案 2: 创建部署脚本
创建 `/opt/hands-on-training/deploy-frontend.sh`：

```bash
#!/bin/bash
set -e

echo "🔨 构建前端..."
cd /opt/hands-on-training/frontend
npm run build

echo "📦 复制文件到 Nginx 目录..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R nginx:nginx /var/www/html/

echo "🔄 重新加载 Nginx..."
sudo systemctl reload nginx

echo "✅ 前端部署完成！"
```

使用方法：
```bash
sudo /opt/hands-on-training/deploy-frontend.sh
```

## 实施推荐方案 1

```bash
# 1. 备份当前配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 2. 修改配置
sudo sed -i 's|root /var/www/html;|root /opt/hands-on-training/frontend/dist;|g' /etc/nginx/nginx.conf

# 3. 测试配置
sudo nginx -t

# 4. 重新加载 Nginx
sudo systemctl reload nginx

# 5. 验证
curl http://54.89.123.129/ | grep index
```

## 验证结果
✅ 浏览器加载最新的 JavaScript 文件
✅ Publish/Unpublish 功能正常工作
✅ 所有练习状态更新正确

## 部署检查清单

每次修改前端代码后：

- [ ] 修改源代码
- [ ] 上传到服务器
- [ ] 运行 `npm run build`
- [ ] **复制文件到 Nginx 目录** ← 之前遗漏的步骤
  ```bash
  sudo cp -r /opt/hands-on-training/frontend/dist/* /var/www/html/
  ```
- [ ] 重新加载 Nginx
  ```bash
  sudo systemctl reload nginx
  ```
- [ ] 验证浏览器加载新文件
  ```bash
  curl http://54.89.123.129/ | grep index
  ```

## 经验教训

### 1. 部署流程要完整
构建 → 复制 → 重启服务，缺一不可

### 2. 配置要合理
Nginx 应该直接指向构建目录，避免额外的复制步骤

### 3. 验证要彻底
不仅要检查服务器上的文件，还要检查浏览器实际加载的文件

### 4. 使用自动化脚本
减少人为错误，确保每次部署步骤一致

### 5. 版本控制
使用文件哈希（如 `index-C0kqIOp-.js`）可以避免浏览器缓存问题

## 相关文件
- `/etc/nginx/nginx.conf` - Nginx 配置
- `/opt/hands-on-training/frontend/dist/` - 前端构建输出
- `/var/www/html/` - Nginx 当前服务目录（临时）

## 后续建议

1. **修改 Nginx 配置**指向 `/opt/hands-on-training/frontend/dist/`
2. **创建部署脚本**自动化部署流程
3. **添加 CI/CD**自动构建和部署
4. **监控文件版本**确保前后端版本一致
