import React from 'react'

function App() {
  return (
    <div className="App animate-fade-in" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 className="animate-slide-down" style={{ color: '#333', marginBottom: '20px' }}>🎯 MarkSyncy 扩展</h1>
      <div className="animate-slide-up" style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>功能状态</h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li className="animate-fade-in" style={{ animationDelay: '0.1s' }}>✅ 扩展已加载</li>
          <li className="animate-fade-in" style={{ animationDelay: '0.2s' }}>✅ React 组件已渲染</li>
          <li className="animate-fade-in" style={{ animationDelay: '0.3s' }}>✅ 基本样式已应用</li>
        </ul>
      </div>
      <div className="animate-slide-up" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', transition: 'all 0.3s ease' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>下一步</h3>
        <p style={{ margin: '0', color: '#555' }}>
          现在可以测试右键菜单收藏功能了！在任何网页上右键点击，选择"收藏此网页"。
        </p>
      </div>
    </div>
  )
}

export default App
