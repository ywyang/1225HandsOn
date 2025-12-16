# Exercise 1 头像提交测试 - cURL命令

## 🎯 测试目标

测试Exercise 1 API的头像上传功能，验证：
- Base64格式头像上传
- 文件格式头像上传  
- 头像数据存储
- 头像下载功能
- 分数计算（包含头像加分）

## 📋 完整测试流程

### 1. 学员注册

```bash
# 注册新学员
curl -X POST "http://54.89.123.129:3001/api/auth/student/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "头像测试学员"}' \
  | jq '.'

# 保存返回的accessKey用于后续步骤
```

### 2. 带头像的Exercise 1提交 (Base64格式)

```bash
# 使用Base64编码的头像数据
curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "头像测试学员",
    "accessKey": "your_access_key_here",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-0abcdef1234567890",
      "internalIpAddress": "10.0.1.100",
      "elasticIpAddress": "203.0.113.100",
      "instanceType": "t3.micro"
    },
    "avatarBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }' \
  | jq '.'
```

**预期响应:**
```json
{
  "success": true,
  "message": "Submission received and processed successfully",
  "submissionId": "uuid-here",
  "score": 100,
  "avatarInfo": {
    "filename": "avatar.png",
    "size": 67,
    "mimetype": "image/png"
  }
}
```

### 3. 带头像的Exercise 1提交 (文件上传格式)

```bash
# 首先创建一个测试图片文件
echo -n "test" > test-avatar.txt

# 使用文件上传格式
curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -F "studentName=头像测试学员" \
  -F "accessKey=your_access_key_here" \
  -F "ec2InstanceInfo[operatingSystem]=Amazon Linux 2" \
  -F "ec2InstanceInfo[amiId]=ami-0abcdef1234567890" \
  -F "ec2InstanceInfo[internalIpAddress]=10.0.1.100" \
  -F "ec2InstanceInfo[elasticIpAddress]=203.0.113.100" \
  -F "ec2InstanceInfo[instanceType]=t3.micro" \
  -F "avatar=@test-avatar.txt" \
  | jq '.'
```

### 4. 验证提交记录

```bash
# 查看学员的所有提交记录
curl -X GET "http://54.89.123.129:3001/api/submissions/student/your_access_key_here" \
  -H "Content-Type: application/json" \
  | jq '.submissions[] | {
    id: .id,
    score: .score,
    avatarInfo: .avatarInfo,
    ec2Info: .ec2InstanceInfo
  }'
```

### 5. 下载头像

```bash
# 使用提交ID下载头像
curl -X GET "http://54.89.123.129:3001/api/submissions/submission_id_here/avatar" \
  -o "downloaded_avatar.png"

# 检查下载的文件
ls -la downloaded_avatar.png
file downloaded_avatar.png
```

### 6. 查看学员统计

```bash
# 查看包含头像加分的统计信息
curl -X GET "http://54.89.123.129:3001/api/statistics/student/your_access_key_here" \
  -H "Content-Type: application/json" \
  | jq '{
    student: .student.name,
    totalScore: .statistics.totalScore,
    highestScore: .statistics.highestScore,
    submissions: [.submissions[] | {score: .score, hasAvatar: .avatarInfo.hasAvatar}]
  }'
```

## 🧪 测试用例

### 测试用例1: PNG格式头像

```bash
# 1x1像素PNG图片的Base64编码
AVATAR_PNG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentName\": \"PNG测试学员\",
    \"accessKey\": \"your_access_key\",
    \"ec2InstanceInfo\": {
      \"operatingSystem\": \"Amazon Linux 2\",
      \"amiId\": \"ami-test\",
      \"internalIpAddress\": \"10.0.1.100\",
      \"elasticIpAddress\": \"203.0.113.100\",
      \"instanceType\": \"t3.micro\"
    },
    \"avatarBase64\": \"$AVATAR_PNG\"
  }"
```

### 测试用例2: JPEG格式头像

```bash
# 1x1像素JPEG图片的Base64编码
AVATAR_JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="

curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentName\": \"JPEG测试学员\",
    \"accessKey\": \"your_access_key\",
    \"ec2InstanceInfo\": {
      \"operatingSystem\": \"Ubuntu 20.04\",
      \"amiId\": \"ami-test\",
      \"internalIpAddress\": \"10.0.1.200\",
      \"elasticIpAddress\": \"203.0.113.200\",
      \"instanceType\": \"t2.small\"
    },
    \"avatarBase64\": \"$AVATAR_JPEG\"
  }"
```

### 测试用例3: 无头像提交（对比分数）

```bash
# 不包含头像的提交，用于对比分数差异
curl -X POST "http://54.89.123.129:3001/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "无头像测试学员",
    "accessKey": "your_access_key",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-test",
      "internalIpAddress": "10.0.1.100",
      "elasticIpAddress": "203.0.113.100",
      "instanceType": "t3.micro"
    }
  }'
```

## 📊 分数对比

| 提交内容 | 预期分数 | 说明 |
|---------|---------|------|
| 完整EC2信息 + 弹性IP + 头像 | 100分 | 满分 |
| 完整EC2信息 + 弹性IP | 90分 | 无头像扣10分 |
| 完整EC2信息 + 头像 | 85分 | 无弹性IP扣15分 |
| 完整EC2信息 | 80分 | 无弹性IP和头像扣20分 |
| 仅头像 | 60分 | EC2信息不完整 |
| 信息不完整且无头像 | 40分 | 最低分 |

## 🔍 验证要点

### 1. 头像数据验证
```bash
# 检查头像是否正确存储
curl -s "http://54.89.123.129:3001/api/submissions/student/your_access_key" \
  | jq '.submissions[0].avatarInfo'

# 预期输出:
# {
#   "filename": "avatar.png",
#   "size": 67,
#   "mimetype": "image/png",
#   "hasAvatar": true
# }
```

### 2. 分数计算验证
```bash
# 检查分数是否包含头像加分
curl -s "http://54.89.123.129:3001/api/submissions/student/your_access_key" \
  | jq '.submissions[] | {score: .score, hasAvatar: .avatarInfo.hasAvatar}'
```

### 3. 头像下载验证
```bash
# 下载并验证头像文件
curl -s "http://54.89.123.129:3001/api/submissions/submission_id/avatar" \
  -o "test_avatar.png"

# 验证文件类型
file test_avatar.png

# 验证文件大小
ls -la test_avatar.png
```

## 🚀 一键测试脚本

运行完整的头像功能测试：

```bash
# 使用我们创建的测试脚本
./test-exercise1-submission-with-avatar.sh
```

或者使用npm脚本：

```bash
npm run test-avatar
```

## ⚠️ 注意事项

1. **Base64格式**: 确保包含正确的MIME类型前缀
2. **文件大小**: 头像文件限制为5MB
3. **支持格式**: PNG、JPEG、GIF等图片格式
4. **Access Key**: 每次测试前需要先注册获取有效的Access Key
5. **分数计算**: 头像会影响最终分数，完整提交可获得满分100分