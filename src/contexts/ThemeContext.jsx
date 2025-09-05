import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 从存储中加载主题偏好
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await chrome.storage.local.get(['darkMode']);
        const savedDarkMode = result.darkMode || false;
        setIsDarkMode(savedDarkMode);
        
        // 应用主题到 document
        if (savedDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('加载主题设置失败:', error);
        // 检查系统偏好作为默认值
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      }
    };

    loadTheme();
  }, []);

  // 切换主题
  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    try {
      // 保存到存储
      await chrome.storage.local.set({ darkMode: newDarkMode });
      
      // 应用主题到 document
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  };

  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
