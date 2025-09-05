import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ManagePage from "./manage.jsx";
import "./index.css";

// 根据页面类型渲染不同的组件
const rootElement = document.getElementById("root");
if (rootElement) {
  // 检查当前页面是popup还是manage
  const isManagePage = window.location.pathname.includes('manage.html') || 
                      document.title.includes('收藏管理');
  
  if (isManagePage) {
    ReactDOM.createRoot(rootElement).render(<ManagePage />);
  } else {
    ReactDOM.createRoot(rootElement).render(<App />);
  }
}