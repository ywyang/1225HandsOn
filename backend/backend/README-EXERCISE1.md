# Hands-on Exercise 1 - API接口文档

## 概述

这是Hands-on Training System的Exercise 1后台接收程序。学员需要在本地开发程序，调用这个API接口提交练习完成信息。

## API接口说明

### 基础URL
```
http://localhost:3000/api
```

### 1. 学员注册

**接口**: `POST /auth/student/register`

**功能**: 学员输入姓名后分配唯一的access key

**请求体**:
```json
{
  "name": "学员姓名"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Registration successful! Please save your access key.",
  "student": {
    "name": "学员姓名",
    "accessKey": "ABC123XYZ",
    "registeredAt": "2024-01-01T10:00:00.000Z"
  },
  "isNewRegistration": true,
  "instructions": "Use this access key when submitting exercise solutions via API."
}
```

### 2. Access Key查询

**接口**: `GET /auth/student/lookup/{姓名}`

**功能**: 通过姓名查询access key

**响应**:
```json
{
  "success": true,
  "message": "Access key found successfully",
  "student": {
    "name": "学员姓名",
    "accessKey": "ABC123XYZ",
    "registeredAt": "2024-01-01T10:00:00.000Z",
    "lastActiveAt": "2024-01-01T11:00:00.000Z"
  }
}
```

### 3. Exercise 1 提交接口 ⭐

**接口**: `POST /submissions/exercise1`

**功能**: 提交练习完成数据，包括EC2实例信息

**请求体**:
```json
{
  "studentName": "学员姓名",
  "accessKey": "ABC123XYZ",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "Submission received and processed successfully",
  "submissionId": "sub-12345",
  "score": 100,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "studentInfo": {
    "name": "学员姓名",
    "accessKey": "ABC123XYZ"
  },
  "ec2Info": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  },
  "clientIp": "203.0.113.1"
}
```

### 4. 查看学员提交记录

**接口**: `GET /submissions/student/{accessKey}`

**功能**: 查看学员的所有提交记录

**响应**:
```json
{
  "success": true,
  "student": {
    "name": "学员姓名",
    "accessKey": "ABC123XYZ",
    "registeredAt": "2024-01-01T10:00:00.000Z"
  },
  "submissions": [
    {
      "id": "sub-12345",
      "exerciseId": "ex-001",
      "score": 100,
      "submittedAt": "2024-01-01T12:00:00.000Z",
      "clientIpAddress": "203.0.113.1",
      "ec2InstanceInfo": {
        "operatingSystem": "Amazon Linux 2",
        "amiId": "ami-0abcdef1234567890",
        "internalIpAddress": "10.0.1.100",
        "instanceType": "t3.micro"
      },
      "processingStatus": "processed"
    }
  ]
}
```

### 5. 查看学员统计信息

**接口**: `GET /statistics/student/{accessKey}`

**功能**: 查看学员的详细统计信息和排名

**响应**:
```json
{
  "success": true,
  "student": {
    "name": "学员姓名",
    "accessKey": "ABC123XYZ",
    "registeredAt": "2024-01-01T10:00:00.000Z",
    "lastActiveAt": "2024-01-01T12:00:00.000Z"
  },
  "statistics": {
    "totalSubmissions": 1,
    "completedExercises": 1,
    "totalExercises": 1,
    "completionRate": 100,
    "totalScore": 100,
    "averageScore": 100,
    "highestScore": 100,
    "currentRank": 1,
    "totalParticipants": 10
  },
  "submissions": [...],
  "progress": {
    "exerciseProgress": [],
    "scoreHistory": [],
    "submissionTimeline": []
  }
}
```

### 6. 查看排行榜

**接口**: `GET /statistics/rankings`

**功能**: 查看所有学员的排名（按分数和完成时间排序）

**响应**:
```json
{
  "success": true,
  "exerciseId": "all",
  "totalStudents": 10,
  "rankings": [
    {
      "rank": 1,
      "studentId": "std-001",
      "studentName": "学员A",
      "totalScore": 100,
      "completedExercises": 1,
      "averageCompletionTime": 0,
      "lastSubmissionAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "rank": 2,
      "studentId": "std-002", 
      "studentName": "学员B",
      "totalScore": 95,
      "completedExercises": 1,
      "averageCompletionTime": 0,
      "lastSubmissionAt": "2024-01-01T12:30:00.000Z"
    }
  ]
}
```

## 学员程序开发指南

### 1. 基本流程

1. **注册获取Access Key**: 调用注册接口获取唯一的access key
2. **收集EC2信息**: 获取当前EC2实例的系统信息
3. **提交数据**: 调用Exercise 1提交接口
4. **查看结果**: 查询个人成绩和排名

### 2. 示例代码

我们提供了完整的示例程序 `student-example.js`，展示了如何：

- 自动获取EC2实例信息
- 调用API接口提交数据
- 查看成绩和排名

**运行示例程序**:
```bash
# 设置学员姓名
export STUDENT_NAME="张三"

# 运行程序
node student-example.js
```

### 3. EC2信息获取

在真实的EC2环境中，可以通过以下方式获取实例信息：

```javascript
// AMI ID
const amiResponse = await fetch('http://169.254.169.254/latest/meta-data/ami-id');
const amiId = await amiResponse.text();

// 实例类型
const typeResponse = await fetch('http://169.254.169.254/latest/meta-data/instance-type');
const instanceType = await typeResponse.text();

// 内网IP
const ipResponse = await fetch('http://169.254.169.254/latest/meta-data/local-ipv4');
const internalIp = await ipResponse.text();
```

### 4. 评分标准

Exercise 1的评分基于提交的数据完整性：

- **100分**: 提供完整的EC2实例信息（操作系统、AMI ID、内网IP、实例类型）
- **50分**: 提供部分信息或信息不完整
- **0分**: 提交失败或数据无效

## 测试和调试

### 1. API测试

运行测试脚本验证API功能：

```bash
node test-api.js
```

### 2. 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 数据库设置

确保PostgreSQL数据库已配置并运行：

```bash
# 运行数据库迁移
npm run migrate
```

## 错误处理

### 常见错误码

- **400**: 请求数据验证失败
- **401**: Access key无效
- **404**: 学员未找到
- **500**: 服务器内部错误

### 错误响应格式

```json
{
  "error": "Validation failed",
  "message": "Student name is required",
  "details": ["Student name is required"]
}
```

## 部署说明

### 环境变量

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_system
DB_USER=postgres
DB_PASSWORD=password

# 服务器配置
PORT=3000
JWT_SECRET=your-secret-key

# API配置
API_BASE_URL=http://localhost:3000/api
```

### Docker部署

```bash
# 构建镜像
docker build -t hands-on-training-backend .

# 运行容器
docker run -p 3000:3000 hands-on-training-backend
```

## 支持和帮助

如果在开发过程中遇到问题：

1. 检查API服务器是否正常运行
2. 验证网络连接和防火墙设置
3. 确认数据库连接正常
4. 查看服务器日志获取详细错误信息

---

**注意**: 这是Exercise 1的API文档。后续的Exercise 2等将有不同的接口和要求。