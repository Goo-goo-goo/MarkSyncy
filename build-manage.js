const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 构建管理页面
async function buildManage() {
  try {
    // 用esbuild构建JS
    console.log('正在构建JavaScript...');
    const result = await esbuild.build({
      entryPoints: ['src/manage-entry.jsx'],
      bundle: true,
      format: 'iife',
      globalName: 'ManageApp',
      outfile: 'dist/manage-bundle.js',
      jsx: 'automatic',
      jsxImportSource: 'react',
      external: ['chrome'],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      loader: {
        '.jsx': 'jsx'
      },
      minify: false, // 保持代码可读性以便调试
      sourcemap: true
    });

    console.log('管理页面构建成功');
    
    // 注意：CSS文件已经通过 Tailwind CLI 生成
    console.log('CSS文件已通过 Tailwind CLI 生成');
    
    // 更新HTML文件，使用绝对路径
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MarkSyncy - 收藏管理</title>
    <link rel="stylesheet" href="manage-bundle.css">
    <style>
      /* 内联关键样式确保基本显示 */
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      #root { min-height: 100vh; }
      .loading { text-align: center; padding: 50px; font-size: 18px; color: #666; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">正在加载管理页面...</div>
    </div>
    <script src="manage-bundle.js"></script>
    <script>
      // 调试脚本
      console.log('HTML加载完成');
      window.addEventListener('load', () => {
        console.log('页面完全加载完成');
        if (typeof ManageApp === 'undefined') {
          console.error('ManageApp未定义');
          document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;">JavaScript加载失败，请检查控制台错误</div>';
        }
      });
    </script>
  </body>
</html>`;

    fs.writeFileSync('dist/manage.html', htmlContent);
    console.log('HTML文件更新成功');
    
    // 复制必要的文件
    if (!fs.existsSync('dist/manifest.json')) {
      fs.copyFileSync('manifest.json', 'dist/manifest.json');
      console.log('manifest.json 复制成功');
    }
    
    if (!fs.existsSync('dist/background.js')) {
      fs.copyFileSync('background.js', 'dist/background.js');
      console.log('background.js 复制成功');
    }
    
    if (!fs.existsSync('dist/content.js')) {
      fs.copyFileSync('content.js', 'dist/content.js');
      console.log('content.js 复制成功');
    }
    
    if (!fs.existsSync('dist/icons')) {
      fs.cpSync('icons', 'dist/icons', { recursive: true });
      console.log('icons 目录复制成功');
    }
    
    console.log('\n🎉 扩展构建完成！');
    console.log('📁 所有文件已生成到 dist/ 目录');
    console.log('🔧 现在可以重新加载扩展并测试管理页面了');
    console.log('⚠️  如果仍有问题，请检查浏览器控制台的错误信息');
    
  } catch (error) {
    console.error('构建失败:', error);
  }
}

buildManage();
