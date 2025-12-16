#!/bin/bash

# Exercise 1 API Python测试运行脚本

echo "🐍 Exercise 1 API Python测试套件"
echo "=================================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查pip是否安装
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 未安装，请先安装pip3"
    exit 1
fi

echo "📦 安装Python依赖..."
pip3 install -r requirements.txt

echo ""
echo "🧪 运行API测试..."
python3 test-api.py

echo ""
echo "💾 运行头像存储测试..."
python3 test-avatar-storage.py

echo ""
echo "👤 运行学员示例程序..."
STUDENT_NAME="Python测试学员" python3 student-example.py

echo ""
echo "✅ 所有Python测试完成！"