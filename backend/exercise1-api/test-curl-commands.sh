#!/bin/bash

# Exercise 1 API 测试 - cURL 命令集合
# 使用AWS部署的API地址

# API配置
API_BASE="http://54.89.123.129:3001"
STUDENT_NAME="测试学员_$(date +%s)"
ACCESS_KEY=""

echo "🚀 开始Exercise 1 API测试 (cURL版本)"
echo "API地址: $API_BASE"
echo "学员姓名: $STUDENT_NAME"
echo ""

# 1. 健康检查
echo "=== 1. 测试健康检查 ==="
curl -X GET "$API_BASE/health" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 2. API信息
echo "=== 2. 获取API信息 ==="
curl -X GET "$API_BASE/api" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 3. 学员注册
echo "=== 3. 学员注册 ==="
REGISTER_RESPONSE=$(curl -X POST "$API_BASE/api/auth/student/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$STUDENT_NAME\"}" \
  -w "\n%{http_code}" \
  -s)

# 分离响应体和状态码
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

echo "状态码: $HTTP_CODE"
echo "$RESPONSE_BODY" | jq '.'

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    ACCESS_KEY=$(echo "$RESPONSE_BODY" | jq -r '.student.accessKey')
    echo "✅ 注册成功，Access Key: $ACCESS_KEY"
else
    echo "❌ 注册失败"
    exit 1
fi
echo ""

# 4. Access Key查询
echo "=== 4. Access Key查询 ==="
curl -X GET "$API_BASE/api/auth/student/lookup/$STUDENT_NAME" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 5. Exercise 1提交 (JSON格式，带Base64头像)
echo "=== 5. Exercise 1提交 (JSON + Base64头像) ==="

# 创建一个简单的Base64头像 (1x1像素PNG)
AVATAR_BASE64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SUBMISSION_DATA=$(cat <<EOF
{
  "studentName": "$STUDENT_NAME",
  "accessKey": "$ACCESS_KEY",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "elasticIpAddress": "203.0.113.100",
    "instanceType": "t3.micro"
  },
  "avatarBase64": "$AVATAR_BASE64"
}
EOF
)

SUBMIT_RESPONSE=$(curl -X POST "$API_BASE/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "$SUBMISSION_DATA" \
  -w "\n%{http_code}" \
  -s)

# 分离响应体和状态码
HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SUBMIT_RESPONSE" | head -n -1)

echo "状态码: $HTTP_CODE"
echo "$RESPONSE_BODY" | jq '.'

if [ "$HTTP_CODE" = "201" ]; then
    SUBMISSION_ID=$(echo "$RESPONSE_BODY" | jq -r '.submissionId')
    SCORE=$(echo "$RESPONSE_BODY" | jq -r '.score')
    echo "✅ 提交成功，提交ID: $SUBMISSION_ID，分数: $SCORE"
else
    echo "❌ 提交失败"
fi
echo ""

# 6. 查看学员提交记录
echo "=== 6. 查看学员提交记录 ==="
curl -X GET "$API_BASE/api/submissions/student/$ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 7. 查看学员统计信息
echo "=== 7. 查看学员统计信息 ==="
curl -X GET "$API_BASE/api/statistics/student/$ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 8. 查看排行榜
echo "=== 8. 查看排行榜 ==="
curl -X GET "$API_BASE/api/statistics/rankings" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  -s | jq '.'
echo ""

# 9. 下载头像 (如果提交成功)
if [ ! -z "$SUBMISSION_ID" ]; then
    echo "=== 9. 下载头像 ==="
    curl -X GET "$API_BASE/api/submissions/$SUBMISSION_ID/avatar" \
      -w "\n状态码: %{http_code}\n" \
      -o "downloaded_avatar.png" \
      -s
    
    if [ -f "downloaded_avatar.png" ]; then
        echo "✅ 头像下载成功: downloaded_avatar.png"
        ls -la downloaded_avatar.png
    else
        echo "❌ 头像下载失败"
    fi
    echo ""
fi

echo "🎉 API测试完成！"
echo "学员信息: $STUDENT_NAME (Access Key: $ACCESS_KEY)"