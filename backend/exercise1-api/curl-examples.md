# Exercise 1 API - cURL 测试命令

## 🔧 基础配置

```bash
# API地址
API_BASE="http://54.89.123.129:3001"

# 测试学员信息
STUDENT_NAME="张三"
ACCESS_KEY="your_access_key_here"  # 注册后获得
```

## 📋 API测试命令

### 1. 健康检查

```bash
curl -X GET "http://54.89.123.129:3001/health" \
  -H "Content-Type: application/json"
```

**预期响应:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-15T14:32:00.000Z",
  "message": "Exercise 1 API Server is running"
}
```

### 2. API信息

```bash
curl -X GET "http://54.89.123.129:3001/api" \
  -H "Content-Type: application/json"
```

### 3. 学员注册

```bash
curl -X POST "http://54.89.123.129:3001/api/auth/student/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "张三"}'
```

**预期响应:**
```json
{
  "success": true,
  "message": "Registration successful! Please save your access key.",
  "student": {
    "name": "张三",
    "accessKey": "abc123def456",
    "registeredAt": "2025-12-15T14:32:00.000Z"
  },
  "isNewRegistration": true
}
```

### 4. Access Key查询

```bash
curl -X GET "http://54.89.123.129:3001/api/auth/student/lookup/张三" \
  -H "Content-Type: application/json"
```

### 5. Exercise 1提交 (JSON格式)

```bash
curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "张三",
    "accessKey": "abc123def456",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-0abcdef1234567890",
      "internalIpAddress": "10.0.1.100",
      "elasticIpAddress": "203.0.113.100",
      "instanceType": "t3.micro"
    },
    "avatarBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### 6. Exercise 1提交 (文件上传格式)

```bash
curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -F "studentName=张三" \
  -F "accessKey=abc123def456" \
  -F "ec2InstanceInfo[operatingSystem]=Amazon Linux 2" \
  -F "ec2InstanceInfo[amiId]=ami-0abcdef1234567890" \
  -F "ec2InstanceInfo[internalIpAddress]=10.0.1.100" \
  -F "ec2InstanceInfo[elasticIpAddress]=203.0.113.100" \
  -F "ec2InstanceInfo[instanceType]=t3.micro" \
  -F "avatar=@avatar.png"
```

### 7. 查看学员提交记录

```bash
curl -X GET "http://54.89.123.129:3001/api/submissions/student/abc123def456" \
  -H "Content-Type: application/json"
```

### 8. 查看学员统计信息

```bash
curl -X GET "http://54.89.123.129:3001/api/statistics/student/abc123def456" \
  -H "Content-Type: application/json"
```

### 9. 查看排行榜

```bash
curl -X GET "http://54.89.123.129:3001/api/statistics/rankings" \
  -H "Content-Type: application/json"
```

### 10. 下载头像

```bash
curl -X GET "http://54.89.123.129:3001/api/submissions/{submissionId}/avatar" \
  -o "avatar.png"
```

## 🚀 快速测试脚本

### 完整测试流程

```bash
#!/bin/bash

# 设置变量
API_BASE="http://54.89.123.129:3001"
STUDENT_NAME="测试学员_$(date +%s)"

echo "开始API测试..."

# 1. 健康检查
echo "1. 健康检查"
curl -s "$API_BASE/health" | jq '.'

# 2. 学员注册
echo "2. 学员注册"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/student/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$STUDENT_NAME\"}")

echo "$RESPONSE" | jq '.'
ACCESS_KEY=$(echo "$RESPONSE" | jq -r '.student.accessKey')

# 3. 提交练习
echo "3. 提交练习"
curl -s -X POST "$API_BASE/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentName\": \"$STUDENT_NAME\",
    \"accessKey\": \"$ACCESS_KEY\",
    \"ec2InstanceInfo\": {
      \"operatingSystem\": \"Amazon Linux 2\",
      \"amiId\": \"ami-0abcdef1234567890\",
      \"internalIpAddress\": \"10.0.1.100\",
      \"elasticIpAddress\": \"203.0.113.100\",
      \"instanceType\": \"t3.micro\"
    }
  }" | jq '.'

# 4. 查看结果
echo "4. 查看提交记录"
curl -s "$API_BASE/api/submissions/student/$ACCESS_KEY" | jq '.'

echo "测试完成！"
```

## 🔍 错误排查

### 常见错误及解决方案

**404 错误:**
```bash
# 检查API地址是否正确
curl -I "http://54.89.123.129:3001/health"
```

**500 错误:**
```bash
# 通常是数据库连接问题，检查服务器日志
# 或者数据格式错误，检查JSON格式
```

**401 错误:**
```bash
# Access Key错误，重新注册或查询正确的Access Key
curl -X GET "http://54.89.123.129:3001/api/auth/student/lookup/张三"
```

## 💡 使用技巧

1. **使用jq格式化JSON输出:**
   ```bash
   curl -s "http://54.89.123.129:3001/api" | jq '.'
   ```

2. **保存响应到文件:**
   ```bash
   curl -s "http://54.89.123.129:3001/api/statistics/rankings" > rankings.json
   ```

3. **显示HTTP状态码:**
   ```bash
   curl -w "\n状态码: %{http_code}\n" "http://54.89.123.129:3001/health"
   ```

4. **测试文件上传:**
   ```bash
   # 创建测试图片
   echo "test" > test.txt
   curl -F "avatar=@test.txt" "http://54.89.123.129:3001/api/submissions/exercise1"
   ```