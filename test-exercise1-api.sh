#!/bin/bash

# Exercise 1 API 测试脚本
# 使用方法: ./test-exercise1-api.sh

set -e

# 配置
API_URL="http://100.49.176.211:3001"
STUDENT_NAME="测试学员$(date +%s)"

echo "=========================================="
echo "Exercise 1 API 测试脚本"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${YELLOW}测试: ${test_name}${NC}"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X $method "$API_URL$endpoint")
    fi
    
    echo "响应:"
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
    
    # 检查是否成功
    if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 测试通过${NC}"
    elif echo "$response" | jq -e '.status' >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 测试通过${NC}"
    else
        echo -e "${RED}✗ 测试失败${NC}"
    fi
    echo "=========================================="
    echo ""
}

# 1. 健康检查
test_api "健康检查" "GET" "/health"

# 2. API 信息
test_api "API 信息" "GET" "/api"

# 3. 提交练习（不带 accessKey）
SUBMISSION_DATA='{
  "studentName": "'"$STUDENT_NAME"'",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2023",
    "amiId": "ami-0c55b159cbfafe1f0",
    "internalIpAddress": "172.31.10.20",
    "elasticIpAddress": "100.49.176.211",
    "instanceType": "t2.micro"
  }
}'

test_api "提交练习（完整信息）" "POST" "/api/submissions/exercise1" "$SUBMISSION_DATA"

# 4. 提交练习（带 base64 头像）
AVATAR_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SUBMISSION_WITH_AVATAR='{
  "studentName": "'"$STUDENT_NAME"'",
  "ec2InstanceInfo": {
    "operatingSystem": "Ubuntu 22.04",
    "amiId": "ami-0c55b159cbfafe1f0",
    "internalIpAddress": "172.31.10.21",
    "elasticIpAddress": "3.80.123.45",
    "instanceType": "t3.small"
  },
  "avatarBase64": "'"$AVATAR_BASE64"'"
}'

test_api "提交练习（带头像）" "POST" "/api/submissions/exercise1" "$SUBMISSION_WITH_AVATAR"

# 5. 学生注册
REGISTER_DATA='{
  "name": "新学员'"$(date +%s)"'"
}'

test_api "学生注册" "POST" "/api/auth/student/register" "$REGISTER_DATA"

# 6. 查询 Access Key
test_api "查询 Access Key" "GET" "/api/auth/student/lookup/$STUDENT_NAME"

# 7. 获取排名
test_api "获取排名" "GET" "/api/statistics/rankings"

echo ""
echo -e "${GREEN}=========================================="
echo "所有测试完成！"
echo "==========================================${NC}"
