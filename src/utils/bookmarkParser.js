// 解析 Netscape 书签格式的工具函数
export const parseNetscapeBookmarks = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const bookmarks = [];
  const folders = [];
  
  // 递归解析 DL 列表
  const parseDL = (dlElement, parentFolder = 'default') => {
    const items = dlElement.children;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.tagName === 'DT') {
        const child = item.firstElementChild;
        
        if (child && child.tagName === 'H3') {
          // 这是一个文件夹
          const folderName = child.textContent.trim();
          const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const addDate = child.getAttribute('ADD_DATE');
          const lastModified = child.getAttribute('LAST_MODIFIED');
          
          const folder = {
            id: folderId,
            name: folderName,
            color: getRandomColor(),
            createdAt: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
            parentFolder: parentFolder
          };
          
          folders.push(folder);
          
          // 查找下一个 DL 元素（文件夹的内容）
          let nextSibling = item.nextElementSibling;
          while (nextSibling && nextSibling.tagName !== 'DL') {
            nextSibling = nextSibling.nextElementSibling;
          }
          
          if (nextSibling && nextSibling.tagName === 'DL') {
            parseDL(nextSibling, folderId);
          }
          
        } else if (child && child.tagName === 'A') {
          // 这是一个书签
          const href = child.getAttribute('HREF');
          const title = child.textContent.trim();
          const addDate = child.getAttribute('ADD_DATE');
          const icon = child.getAttribute('ICON');
          
          if (href && title) {
            const bookmark = {
              id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              url: href,
              favicon: icon || '',
              timestamp: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
              group: parentFolder
            };
            
            bookmarks.push(bookmark);
          }
        }
      }
    }
  };
  
  // 查找所有的 DL 元素并开始解析
  const dlElements = doc.querySelectorAll('DL');
  dlElements.forEach(dl => parseDL(dl));
  
  // 如果没有找到文件夹，但有根级别的书签，创建一个默认文件夹
  if (folders.length === 0 && bookmarks.length > 0) {
    const rootFolder = {
      id: 'imported_bookmarks',
      name: '导入的收藏',
      color: '#667eea',
      createdAt: new Date().toISOString(),
      parentFolder: 'default'
    };
    folders.push(rootFolder);
    
    // 将所有根级别的书签移动到这个文件夹
    bookmarks.forEach(bookmark => {
      bookmark.group = 'imported_bookmarks';
    });
  }
  
  return { bookmarks, folders };
};

// 生成随机颜色
export const getRandomColor = () => {
  const colors = [
    '#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 从文件中导入书签
export const importBookmarksFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const { bookmarks, folders } = parseNetscapeBookmarks(content);
        resolve({ bookmarks, folders });
      } catch (error) {
        reject(new Error('解析书签文件失败: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};