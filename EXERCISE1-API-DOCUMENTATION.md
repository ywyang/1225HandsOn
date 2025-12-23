# Exercise 1 API 调用文档

## 基本信息

**API 地址：** `http://100.49.176.211:3001`

**Content-Type：** `application/json`

---

## 提交练习接口

### 接口地址
```
POST /api/submissions/exercise1
```

### 请求参数

| 参数名 | 类型 | 必填 | 长度限制 | 说明 |
|--------|------|------|----------|------|
| studentName | string | 是 | 1-100 | 学生姓名 |
| ec2InstanceInfo | object | 是 | - | EC2 实例信息 |
| ├─ operatingSystem | string | 是 | - | 操作系统（如：Amazon Linux 2023） |
| ├─ amiId | string | 是 | - | AMI ID（如：ami-0c55b159cbfafe1f0） |
| ├─ internalIpAddress | string | 是 | IP格式 | 内网IP地址（如：172.31.10.20） |
| ├─ elasticIpAddress | string | 否 | IP格式 | 弹性IP地址（如：100.49.176.211） |
| └─ instanceType | string | 是 | - | 实例类型（如：t2.micro） |
| industryCategory | string | 否 | 最长255 | 行业分类（如：云计算、金融科技） |
| industryResearch | string | 否 | 最长1024 | 行业研究内容 |
| avatarBase64 | string | 否 | - | 头像图片的 Base64 编码 |

### 请求示例

```bash
curl -X POST http://100.49.176.211:3001/api/submissions/exercise1 \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "张三",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2023",
      "amiId": "ami-0c55b159cbfafe1f0",
      "internalIpAddress": "172.31.10.20",
      "elasticIpAddress": "100.49.176.211",
      "instanceType": "t2.micro"
    },
    "industryCategory": "云计算",
    "industryResearch": "云计算是一种基于互联网的计算方式，通过这种方式，共享的软硬件资源和信息可以按需提供给计算机和其他设备。",
    "avatarBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### 响应示例

**成功响应（200）：**
```json
{
  "success": true,
  "message": "Submission received and processed successfully",
  "submissionId": "03713c54-fbef-4603-afde-07928e378ade",
  "score": 100,
  "timestamp": "2025-12-23T02:10:43.926Z",
  "studentInfo": {
    "name": "张三",
    "accessKey": "tg6xbgqwjm7za0it38i9v"
  },
  "ec2Info": {
    "operatingSystem": "Amazon Linux 2023",
    "amiId": "ami-0c55b159cbfafe1f0",
    "internalIpAddress": "172.31.10.20",
    "elasticIpAddress": "100.49.176.211",
    "instanceType": "t2.micro"
  },
  "avatarInfo": {
    "filename": "avatar.png",
    "size": 68,
    "mimetype": "image/png"
  },
  "clientIp": "::ffff:114.251.173.133"
}
```

**错误响应（400）：**
```json
{
  "error": "Validation failed",
  "details": [
    "\"studentName\" is required",
    "\"ec2InstanceInfo.operatingSystem\" is required"
  ]
}
```

---

## 评分规则

系统会根据提交的信息自动计算分数：

| 提交内容 | 得分 |
|---------|------|
| 完整EC2信息 + 弹性IP + 头像 | 100分 |
| 完整EC2信息 + 弹性IP | 90分 |
| 完整EC2信息 + 头像 | 85分 |
| 完整EC2信息 | 80分 |
| 仅头像 | 60分 |
| 不完整信息 | 40分 |

**完整EC2信息包括：**
- operatingSystem
- amiId
- internalIpAddress
- instanceType

---

## 其他接口

### 1. 健康检查
```bash
GET /health
```

**响应：**
```json
{
  "status": "OK",
  "timestamp": "2025-12-23T02:10:43.926Z",
  "message": "Exercise 1 API Server is running"
}
```

### 2. 学生注册
```bash
POST /api/auth/student/register
Content-Type: application/json

{
  "name": "学生姓名"
}
```

**响应：**
```json
{
  "success": true,
  "message": "Registration successful! Please save your access key.",
  "student": {
    "name": "学生姓名",
    "accessKey": "abc123xyz456",
    "registeredAt": "2025-12-23T02:10:43.926Z"
  },
  "isNewRegistration": true
}
```

### 3. 查询 Access Key
```bash
GET /api/auth/student/lookup/:name
```

**示例：**
```bash
curl http://100.49.176.211:3001/api/auth/student/lookup/张三
```

### 4. 查询学生提交记录
```bash
GET /api/submissions/student/:accessKey
```

### 5. 获取排名
```bash
GET /api/statistics/rankings
```

**响应：**
```json
{
  "success": true,
  "exerciseId": "all",
  "totalStudents": 10,
  "rankings": [
    {
      "rank": 1,
      "studentId": "uuid",
      "studentName": "张三",
      "totalScore": 100,
      "completedExercises": 1,
      "averageCompletionTime": 0,
      "lastSubmissionAt": "2025-12-23T02:10:43.926Z"
    }
  ]
}
```

### 6. 获取头像图片
```bash
GET /api/submissions/:submissionId/avatar
```

**响应：** 图片二进制数据

---

## 注意事项

1. **不需要 accessKey**：提交时只需要学生姓名，系统会自动创建或查找学生记录
2. **头像格式**：支持 Base64 编码的图片，建议大小不超过 5MB
3. **IP 地址格式**：必须是有效的 IPv4 地址格式
4. **字符长度限制**：
   - studentName: 1-100 字符
   - industryCategory: 最长 255 字符
   - industryResearch: 最长 1024 字符
5. **可选字段**：elasticIpAddress、industryCategory、industryResearch、avatarBase64 都是可选的

---

## 快速测试

使用提供的测试脚本：

```bash
# 简单测试
./test-simple.sh

# 完整测试
./test-exercise1-api.sh
```

---

## 常见问题

**Q: 如何获取 Base64 编码的图片？**

A: 使用以下命令：
```bash
base64 -i avatar.png
```

或在 JavaScript 中：
```javascript
const fs = require('fs');
const imageBuffer = fs.readFileSync('avatar.png');
const base64Image = imageBuffer.toString('base64');
```

**Q: 可以重复提交吗？**

A: 可以，系统会记录所有提交，排名使用最高分。

**Q: 如何查看我的提交记录？**

A: 使用返回的 accessKey 调用：
```bash
GET /api/submissions/student/:accessKey
```

---

## 联系支持

如有问题，请联系技术支持团队。
