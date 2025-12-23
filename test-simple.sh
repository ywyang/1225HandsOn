#!/bin/bash

# 简单的 Exercise 1 API 测试脚本

API_URL="http://100.49.176.211:3001"

echo "=== 测试 Exercise 1 API ==="
echo ""

# 1. 健康检查
echo "1. 健康检查"
curl -s "$API_URL/health" | jq .
echo ""

# 2. 提交练习（包含所有字段）
echo "2. 提交练习（完整参数）"

# Base64 编码的 1x1 像素图片
AVATAR_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

curl -s -X POST "$API_URL/api/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "测试学员完整版",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2023",
      "amiId": "ami-0c55b159cbfafe1f0",
      "internalIpAddress": "172.31.10.20",
      "elasticIpAddress": "100.49.176.211",
      "instanceType": "t2.micro"
    },
    "industryCategory": "云计算",
    "industryResearch": "云计算是一种基于互联网的计算方式，通过这种方式，共享的软硬件资源和信息可以按需提供给计算机和其他设备。",
    "avatarBase64": "'"$AVATAR_BASE64"'"
  }' | jq .
echo ""

# 3. 获取排名
echo "3. 获取排名（前3名）"
curl -s "$API_URL/api/statistics/rankings" | jq '.rankings | .[:3]'
echo ""

echo "=== 测试完成 ==="
