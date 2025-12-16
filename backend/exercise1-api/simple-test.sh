#!/bin/bash

# 简单的API测试命令
echo "Exercise 1 API 测试命令"
echo "======================="
echo ""

echo "1. 健康检查:"
echo "curl -X GET \"http://54.89.123.129:3001/health\""
echo ""

echo "2. 学员注册:"
echo "curl -X POST \"http://54.89.123.129:3001/api/auth/student/register\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\": \"张三\"}'"
echo ""

echo "3. Access Key查询:"
echo "curl -X GET \"http://54.89.123.129:3001/api/auth/student/lookup/张三\""
echo ""

echo "4. Exercise 1提交:"
echo "curl -X POST \"http://54.89.123.129:3001/api/submissions/exercise1\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"studentName\": \"张三\","
echo "    \"accessKey\": \"your_access_key_here\","
echo "    \"ec2InstanceInfo\": {"
echo "      \"operatingSystem\": \"Amazon Linux 2\","
echo "      \"amiId\": \"ami-0abcdef1234567890\","
echo "      \"internalIpAddress\": \"10.0.1.100\","
echo "      \"elasticIpAddress\": \"203.0.113.100\","
echo "      \"instanceType\": \"t3.micro\""
echo "    }"
echo "  }'"
echo ""

echo "5. 查看提交记录:"
echo "curl -X GET \"http://54.89.123.129:3001/api/submissions/student/your_access_key_here\""
echo ""

echo "6. 查看排行榜:"
echo "curl -X GET \"http://54.89.123.129:3001/api/statistics/rankings\""
echo ""

echo "注意: 请将 'your_access_key_here' 替换为实际的Access Key"