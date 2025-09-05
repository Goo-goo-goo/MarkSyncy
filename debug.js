// MarkSyncy 扩展调试脚本
// 在浏览器控制台中运行此脚本来诊断问题

console.log('🔍 MarkSyncy 扩展调试开始...');

// 检查扩展是否已安装
function checkExtension() {
  console.log('📋 检查扩展状态...');
  
  // 检查chrome对象
  if (typeof chrome !== 'undefined') {
    console.log('✅ Chrome API 可用');
    console.log('Chrome 版本:', chrome.runtime?.getManifest?.()?.version || '未知');
  } else {
    console.log('❌ Chrome API 不可用');
  }
  
  // 检查扩展权限
  if (chrome?.permissions) {
    chrome.permissions.getAll((permissions) => {
      console.log('🔐 扩展权限:', permissions);
    });
  }
  
  // 检查存储
  if (chrome?.storage) {
    chrome.storage.local.get(null, (items) => {
      console.log('💾 本地存储内容:', items);
    });
  }
}

// 检查页面元素
function checkPageElements() {
  console.log('🔍 检查页面元素...');
  
  const root = document.getElementById('root');
  if (root) {
    console.log('✅ Root 元素存在:', root);
    console.log('Root 内容:', root.innerHTML);
  } else {
    console.log('❌ Root 元素不存在');
  }
  
  // 检查脚本加载
  const scripts = document.querySelectorAll('script');
  console.log('📜 页面脚本数量:', scripts.length);
  scripts.forEach((script, index) => {
    console.log(`脚本 ${index + 1}:`, script.src || '内联脚本');
  });
  
  // 检查样式加载
  const styles = document.querySelectorAll('link[rel="stylesheet"]');
  console.log('🎨 样式表数量:', styles.length);
  styles.forEach((style, index) => {
    console.log(`样式 ${index + 1}:`, style.href);
  });
}

// 检查错误
function checkErrors() {
  console.log('🚨 检查错误...');
  
  // 监听错误
  window.addEventListener('error', (event) => {
    console.error('❌ 页面错误:', event.error);
    console.error('错误详情:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 未处理的Promise拒绝:', event.reason);
  });
}

// 测试扩展功能
function testExtensionFeatures() {
  console.log('🧪 测试扩展功能...');
  
  // 测试右键菜单
  if (chrome?.contextMenus) {
    console.log('✅ 右键菜单API可用');
  } else {
    console.log('❌ 右键菜单API不可用');
  }
  
  // 测试存储
  if (chrome?.storage) {
    console.log('✅ 存储API可用');
    // 尝试写入测试数据
    chrome.storage.local.set({ test: 'MarkSyncy测试数据' }, () => {
      console.log('✅ 存储写入测试成功');
      // 读取测试数据
      chrome.storage.local.get(['test'], (result) => {
        console.log('✅ 存储读取测试成功:', result);
      });
    });
  } else {
    console.log('❌ 存储API不可用');
  }
}

// 运行所有检查
function runAllChecks() {
  console.log('🚀 开始全面诊断...');
  console.log('=====================================');
  
  checkExtension();
  checkPageElements();
  checkErrors();
  testExtensionFeatures();
  
  console.log('=====================================');
  console.log('🎯 诊断完成！请查看上面的结果。');
}

// 自动运行诊断
runAllChecks();

// 导出函数供手动调用
window.MarkSyncyDebug = {
  checkExtension,
  checkPageElements,
  checkErrors,
  testExtensionFeatures,
  runAllChecks
};

console.log('💡 提示: 使用 MarkSyncyDebug.runAllChecks() 重新运行诊断');
