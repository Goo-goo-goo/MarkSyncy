#!/bin/bash

echo "🚀 启动 MarkSyncy 扩展开发服务器..."

# 检查是否在正确的目录
if [ ! -f "manifest.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 构建项目
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功！"

# 启动HTTP服务器
echo "🌐 启动HTTP服务器在 http://localhost:8000"
echo "📁 使用 dist/ 目录中的文件"
echo ""
echo "💡 提示："
echo "   1. 在浏览器中打开 http://localhost:8000/popup.html 测试popup"
echo "   2. 在浏览器中打开 http://localhost:8000/manage.html 测试管理页面"
echo "   3. 按 Ctrl+C 停止服务器"
echo ""

cd dist && python3 -m http.server 8000
