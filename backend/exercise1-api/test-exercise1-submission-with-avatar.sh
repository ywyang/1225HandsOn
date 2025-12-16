#!/bin/bash

# Exercise 1 提交测试 - 带头像功能
# 测试 test_exercise1_submission_with_avatar

# API配置
API_BASE="http://54.89.123.129:3001"
STUDENT_NAME="头像测试学员_$(date +%s)"
ACCESS_KEY=""

echo "🚀 测试Exercise 1提交 - 带头像功能"
echo "API地址: $API_BASE"
echo "学员姓名: $STUDENT_NAME"
echo ""

# 步骤1: 学员注册
echo "=== 步骤1: 学员注册 ==="
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
    echo "❌ 注册失败，无法继续测试"
    exit 1
fi
echo ""

# 步骤2: 创建测试头像 (Base64格式)
echo "=== 步骤2: 准备测试头像 ==="

# 创建一个简单的1x1像素PNG图片的Base64编码
AVATAR_BASE64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "✅ 头像Base64数据准备完成 (1x1像素PNG)"
echo "头像数据长度: ${#AVATAR_BASE64} 字符"
echo ""

# 步骤3: Exercise 1提交 (JSON格式 + Base64头像)
echo "=== 步骤3: Exercise 1提交 (JSON + Base64头像) ==="

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

echo "提交数据:"
echo "$SUBMISSION_DATA" | jq '.'
echo ""

SUBMIT_RESPONSE=$(curl -X POST "$API_BASE/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "$SUBMISSION_DATA" \
  -w "\n%{http_code}" \
  -s)

# 分离响应体和状态码
HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SUBMIT_RESPONSE" | head -n -1)

echo "提交响应:"
echo "状态码: $HTTP_CODE"
echo "$RESPONSE_BODY" | jq '.'

if [ "$HTTP_CODE" = "201" ]; then
    SUBMISSION_ID=$(echo "$RESPONSE_BODY" | jq -r '.submissionId')
    SCORE=$(echo "$RESPONSE_BODY" | jq -r '.score')
    echo "✅ 提交成功！"
    echo "   提交ID: $SUBMISSION_ID"
    echo "   分数: $SCORE"
    echo "   预期分数: 100 (完整EC2信息 + 弹性IP + 头像)"
else
    echo "❌ 提交失败"
    exit 1
fi
echo ""

# 步骤4: 验证提交记录
echo "=== 步骤4: 验证提交记录 ==="
SUBMISSIONS_RESPONSE=$(curl -X GET "$API_BASE/api/submissions/student/$ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -s)

echo "$SUBMISSIONS_RESPONSE" | jq '.'

# 检查头像信息
HAS_AVATAR=$(echo "$SUBMISSIONS_RESPONSE" | jq -r '.submissions[0].avatarInfo.hasAvatar // false')
AVATAR_SIZE=$(echo "$SUBMISSIONS_RESPONSE" | jq -r '.submissions[0].avatarInfo.size // 0')

echo ""
echo "头像验证:"
echo "  有头像: $HAS_AVATAR"
echo "  头像大小: $AVATAR_SIZE bytes"

if [ "$HAS_AVATAR" = "true" ] && [ "$AVATAR_SIZE" -gt "0" ]; then
    echo "✅ 头像数据已正确存储"
else
    echo "❌ 头像数据存储失败"
fi
echo ""

# 步骤5: 下载头像测试
if [ ! -z "$SUBMISSION_ID" ]; then
    echo "=== 步骤5: 下载头像测试 ==="
    
    AVATAR_DOWNLOAD=$(curl -X GET "$API_BASE/api/submissions/$SUBMISSION_ID/avatar" \
      -w "%{http_code}" \
      -o "test_avatar_download.png" \
      -s)
    
    echo "下载状态码: $AVATAR_DOWNLOAD"
    
    if [ "$AVATAR_DOWNLOAD" = "200" ] && [ -f "test_avatar_download.png" ]; then
        DOWNLOADED_SIZE=$(wc -c < "test_avatar_download.png")
        echo "✅ 头像下载成功"
        echo "   文件: test_avatar_download.png"
        echo "   大小: $DOWNLOADED_SIZE bytes"
        
        # 验证文件是否为PNG格式
        if file "test_avatar_download.png" | grep -q "PNG"; then
            echo "✅ 文件格式验证: PNG格式正确"
        else
            echo "⚠️ 文件格式验证: 可能不是标准PNG格式"
        fi
    else
        echo "❌ 头像下载失败"
    fi
    echo ""
fi

# 步骤6: 测试不同头像格式
echo "=== 步骤6: 测试其他头像格式 ==="

# 测试JPEG格式的Base64头像
JPEG_AVATAR_BASE64="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="

JPEG_SUBMISSION_DATA=$(cat <<EOF
{
  "studentName": "$STUDENT_NAME",
  "accessKey": "$ACCESS_KEY",
  "ec2InstanceInfo": {
    "operatingSystem": "Ubuntu 20.04",
    "amiId": "ami-0xyz789",
    "internalIpAddress": "10.0.2.200",
    "elasticIpAddress": "203.0.113.200",
    "instanceType": "t2.small"
  },
  "avatarBase64": "$JPEG_AVATAR_BASE64"
}
EOF
)

echo "测试JPEG格式头像提交..."
JPEG_SUBMIT_RESPONSE=$(curl -X POST "$API_BASE/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "$JPEG_SUBMISSION_DATA" \
  -w "\n%{http_code}" \
  -s)

JPEG_HTTP_CODE=$(echo "$JPEG_SUBMIT_RESPONSE" | tail -n1)
JPEG_RESPONSE_BODY=$(echo "$JPEG_SUBMIT_RESPONSE" | head -n -1)

echo "JPEG头像提交状态码: $JPEG_HTTP_CODE"

if [ "$JPEG_HTTP_CODE" = "201" ]; then
    JPEG_SCORE=$(echo "$JPEG_RESPONSE_BODY" | jq -r '.score')
    echo "✅ JPEG头像提交成功，分数: $JPEG_SCORE"
else
    echo "❌ JPEG头像提交失败"
fi
echo ""

# 步骤7: 查看最终统计
echo "=== 步骤7: 查看学员统计 ==="
curl -X GET "$API_BASE/api/statistics/student/$ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '{
    student: .student,
    statistics: .statistics,
    submissionCount: (.submissions | length),
    scores: [.submissions[].score]
  }'

echo ""
echo "🎉 Exercise 1 头像提交测试完成！"
echo ""
echo "📋 测试总结:"
echo "  学员: $STUDENT_NAME"
echo "  Access Key: $ACCESS_KEY"
echo "  提交次数: 2 (PNG + JPEG)"
echo "  测试文件: test_avatar_download.png"
echo ""
echo "🔍 验证要点:"
echo "  ✓ Base64头像数据正确解析"
echo "  ✓ 头像数据存储到数据库"
echo "  ✓ 头像下载功能正常"
echo "  ✓ 支持PNG和JPEG格式"
echo "  ✓ 分数计算包含头像加分"

# 清理测试文件
if [ -f "test_avatar_download.png" ]; then
    echo ""
    echo "🧹 清理测试文件..."
    rm -f "test_avatar_download.png"
    echo "✅ 测试文件已清理"
fi