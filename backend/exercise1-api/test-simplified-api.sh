#!/bin/bash

# 测试简化后的Exercise 1 API (无需accessKey)

API_BASE_URL="http://localhost:3001/api"
STUDENT_NAME="测试学员"

echo "🧪 测试简化后的Exercise 1 API"
echo "================================="
echo

# 1. 健康检查
echo "1️⃣ 健康检查"
curl -s "http://localhost:3001/health" | jq '.'
echo
echo

# 2. 测试提交 (无头像)
echo "2️⃣ 测试Exercise 1提交 (无头像)"
curl -X POST "${API_BASE_URL}/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "'${STUDENT_NAME}'",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-0abcdef1234567890",
      "internalIpAddress": "10.0.1.100",
      "elasticIpAddress": "203.0.113.100",
      "instanceType": "t3.micro"
    }
  }' | jq '.'
echo
echo

# 3. 测试提交 (带头像)
echo "3️⃣ 测试Exercise 1提交 (带头像)"
# 简单的1x1像素PNG图片的base64
AVATAR_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="

curl -X POST "${API_BASE_URL}/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "'${STUDENT_NAME}'",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-0abcdef1234567890",
      "internalIpAddress": "10.0.1.100",
      "elasticIpAddress": "203.0.113.100",
      "instanceType": "t3.micro"
    },
    "avatarBase64": "data:image/png;base64,'${AVATAR_BASE64}'"
  }' | jq '.'
echo
echo

# 4. 查看排行榜
echo "4️⃣ 查看排行榜"
curl -s "${API_BASE_URL}/statistics/rankings" | jq '.'
echo
echo

echo "✅ 测试完成！"
echo
echo "💡 说明："
echo "   - 现在提交时不再需要accessKey参数"
echo "   - 系统会自动为新学员创建记录"
echo "   - 提交时会自动记录当前时间戳"