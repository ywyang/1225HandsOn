#!/bin/bash

# Exercise 1 API Server 启动脚本

echo "🚀 启动 Exercise 1 API Server"
echo "================================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json，请确保在正确的目录中运行"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 检查环境配置文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，复制示例配置..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改数据库配置"
fi

# 启动服务器
echo "🚀 启动服务器..."
npm start