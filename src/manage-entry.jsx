import React from 'react';
import ReactDOM from 'react-dom/client';
import ManagePage from './manage.jsx';
import './manage.css'; // 使用专门的管理页面CSS

// 创建根元素并渲染管理页面
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ManagePage />
  </React.StrictMode>
);
