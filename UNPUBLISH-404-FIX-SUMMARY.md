# Unpublish 操作 404 错误修复总结

## 问题描述
在 `http://54.89.123.129/admin/exercises` 页面进行 unpublish 操作时，请求返回 404 错误。

## 根本原因
前端和后端的 HTTP 方法不匹配：
- **前端**：使用 `PUT` 方法调用 `/api/exercises/:id/unpublish`
- **后端**：定义的是 `POST` 方法

```typescript
// 前端 (api.ts)
unpublishExercise: async (id: string): Promise<Exercise> => {
  return apiRequest(() =>
    apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}/unpublish`)  // PUT
  );
}
```

```javascript
// 后端 (exercises.js)
router.post('/:id/unpublish', async (req, res) => {  // POST
  // ...
});
```

## 解决方案
将后端的 `publish` 和 `unpublish` 路由从 `POST` 改为 `PUT` 方法，与前端保持一致。

### 修改内容
文件：`src/routes/exercises.js`

```javascript
// 修改前
router.post('/:id/publish', async (req, res) => { ... });
router.post('/:id/unpublish', async (req, res) => { ... });

// 修改后
router.put('/:id/publish', async (req, res) => { ... });
router.put('/:id/unpublish', async (req, res) => { ... });
```

### 为什么选择改后端而不是前端？
1. **语义正确性**：`PUT` 方法更适合更新资源状态的操作
2. **RESTful 最佳实践**：发布/取消发布是更新操作，应该使用 `PUT` 或 `PATCH`
3. **最小改动**：只需修改后端两行代码

## 部署步骤
```bash
# 1. 上传修复后的文件
scp -i ~/ec2world/us-east-1.pem src/routes/exercises.js ec2-user@54.89.123.129:/tmp/

# 2. SSH 到服务器并替换文件
ssh -i ~/ec2world/us-east-1.pem ec2-user@54.89.123.129
sudo mv /tmp/exercises.js /opt/hands-on-training/backend/src/routes/exercises.js
sudo chown ec2-user:ec2-user /opt/hands-on-training/backend/src/routes/exercises.js

# 3. 重启后端服务
pm2 restart hands-on-backend
```

## 验证结果
✅ Publish 操作正常工作
✅ Unpublish 操作正常工作

测试命令：
```bash
# 测试 unpublish
curl -X PUT http://54.89.123.129/api/exercises/{exercise-id}/unpublish

# 测试 publish
curl -X PUT http://54.89.123.129/api/exercises/{exercise-id}/publish
```

## 相关文件
- `/opt/hands-on-training/backend/src/routes/exercises.js` - 练习路由
- `frontend/src/services/api.ts` - 前端 API 调用

## 经验教训
1. **前后端接口一致性**：确保前后端使用相同的 HTTP 方法
2. **RESTful 设计**：
   - `GET` - 获取资源
   - `POST` - 创建资源
   - `PUT/PATCH` - 更新资源
   - `DELETE` - 删除资源
3. **API 文档**：维护清晰的 API 文档避免此类问题
4. **集成测试**：添加端到端测试验证前后端集成

## HTTP 方法选择建议
对于发布/取消发布这类状态切换操作，有几种常见做法：

1. **PUT 方法**（本次采用）：
   ```
   PUT /exercises/:id/publish
   PUT /exercises/:id/unpublish
   ```

2. **PATCH 方法**：
   ```
   PATCH /exercises/:id
   Body: { "isPublished": true/false }
   ```

3. **PUT 方法 + 布尔参数**：
   ```
   PUT /exercises/:id
   Body: { "isPublished": true/false }
   ```

本次选择方案 1，因为它语义清晰，易于理解和使用。
