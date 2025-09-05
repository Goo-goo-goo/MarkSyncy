// 解析 Netscape 书签格式的工具函数
export const parseNetscapeBookmarks = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const bookmarks = [];
  const folders = [];
  
  // 使用文件夹栈来跟踪当前解析的文件夹上下文
  const folderStack = ['default']; // 默认根级别
  
  console.log('开始解析书签文件...');
  console.log('HTML内容预览:', htmlContent.substring(0, 500));
  
  // 递归解析 DL 列表
  const parseDL = (dlElement, level = 0) => {
    const items = dlElement.children;
    
    console.log(`解析DL元素，层级: ${level}, 子元素数量: ${items.length}, 当前文件夹栈:`, folderStack);
    
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
          const isPersonalToolbar = child.getAttribute('PERSONAL_TOOLBAR_FOLDER') === 'true';
          
          console.log(`发现文件夹: ${folderName}, 父文件夹: ${folderStack[folderStack.length - 1]}, 个人工具栏: ${isPersonalToolbar}`);
          
          const folder = {
            id: folderId,
            name: folderName,
            color: getRandomColor(),
            createdAt: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
            parentFolder: folderStack[folderStack.length - 1] === 'default' ? 'default' : folderStack[folderStack.length - 1], // 当前栈顶作为父文件夹
            isPersonalToolbar: isPersonalToolbar,
            level: level
          };
          
          folders.push(folder);
          
          // 将新文件夹推入栈顶，成为当前解析的文件夹
          folderStack.push(folderId);
          console.log(`文件夹栈变化: 推入 ${folderName}, 当前栈:`, [...folderStack]);
          
          // 查找 DL 元素（文件夹的内容）
          // 在Edge书签格式中，DL可能是H3的兄弟元素，或者在DT元素内部
          let contentDL = null;
          
          // 首先检查DT元素内部是否有DL
          const dlInDT = item.querySelector('DL');
          if (dlInDT) {
            contentDL = dlInDT;
            console.log(`在DT元素内部找到 ${folderName} 的内容DL`);
          } else {
            // 检查DT元素的兄弟元素
            let searchElement = item.nextElementSibling;
            console.log(`从 ${folderName} 的DT元素后面查找DL元素`);
            while (searchElement) {
              console.log(`检查兄弟元素: ${searchElement.tagName}`);
              if (searchElement.tagName === 'DL') {
                contentDL = searchElement;
                console.log(`在兄弟元素中找到 ${folderName} 的内容DL`);
                break;
              }
              searchElement = searchElement.nextElementSibling;
            }
          }
          
          if (contentDL) {
            console.log(`开始解析 ${folderName} 的内容`);
            parseDL(contentDL, level + 1);
          } else {
            console.log(`文件夹 ${folderName} 没有找到对应的内容DL`);
          }
          
          // 重要：只有在解析完子文件夹内容后，才从栈中弹出
          // 这样确保该文件夹下的所有书签都能正确归属
          folderStack.pop();
          console.log(`文件夹栈变化: 弹出 ${folderName}, 当前栈:`, [...folderStack]);
          
        } else if (child && child.tagName === 'A') {
          // 这是一个书签，应该归属到当前栈顶的文件夹
          const href = child.getAttribute('HREF');
          const title = child.textContent.trim();
          const addDate = child.getAttribute('ADD_DATE');
          const icon = child.getAttribute('ICON');
          
          if (href && title) {
            const currentFolderId = folderStack[folderStack.length - 1]; // 当前栈顶文件夹
            
            console.log(`发现书签: ${title}, 归属到文件夹ID: ${currentFolderId}`);
            
            const bookmark = {
              id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              url: href,
              favicon: icon || '',
              timestamp: addDate ? new Date(parseInt(addDate) * 1000).toISOString() : new Date().toISOString(),
              group: currentFolderId
            };
            
            bookmarks.push(bookmark);
          }
        }
      }
    }
  };
  
  // 查找根级别的 DL 元素并开始解析
  const rootDL = doc.querySelector('DL');
  console.log('查找根DL元素:', rootDL);
  if (rootDL) {
    console.log('根DL元素的子元素:', rootDL.children);
    console.log('根DL元素的innerHTML:', rootDL.innerHTML.substring(0, 500));
    console.log('开始解析根DL元素');
    parseDL(rootDL, 0);
  } else {
    console.log('未找到根DL元素，尝试查找所有DL元素');
    const allDLs = doc.querySelectorAll('DL');
    console.log('找到所有DL元素:', allDLs.length);
    allDLs.forEach((dl, index) => {
      console.log(`DL ${index}:`, dl);
    });
  }
  
  console.log('解析完成，结果:', { 
    folders: folders.length, 
    bookmarks: bookmarks.length,
    folders: folders.map(f => ({ name: f.name, id: f.id, parent: f.parentFolder })),
    bookmarks: bookmarks.map(b => ({ title: b.title, group: b.group }))
  });
  
  // 如果没有找到文件夹，但有根级别的书签，创建一个默认文件夹
  if (folders.length === 0 && bookmarks.length > 0) {
    const rootFolder = {
      id: 'imported_bookmarks',
      name: '导入的收藏',
      color: '#667eea',
      createdAt: new Date().toISOString(),
      parentFolder: 'default',
      isPersonalToolbar: false,
      level: 0
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

// 导出书签为Netscape格式
export const exportBookmarksToNetscape = (bookmarks, folders) => {
  const now = Math.floor(Date.now() / 1000);
  
  // 构建文件夹层级结构
  const folderMap = new Map();
  const rootFolders = [];
  
  // 创建文件夹映射
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    });
  });
  
  // 构建层级关系
  folders.forEach(folder => {
    if (folder.parentFolder === 'default' || !folder.parentFolder) {
      rootFolders.push(folderMap.get(folder.id));
    } else {
      const parent = folderMap.get(folder.parentFolder);
      if (parent) {
        parent.children.push(folderMap.get(folder.id));
      } else {
        // 如果找不到父文件夹，将其作为根文件夹
        rootFolders.push(folderMap.get(folder.id));
      }
    }
  });
  
  // 递归生成文件夹HTML，保持正确的缩进
  const generateFolderHTML = (folder, indent = 0) => {
    const spaces = '    '.repeat(indent);
    const addDate = Math.floor(new Date(folder.createdAt).getTime() / 1000);
    const lastModified = Math.floor(new Date(folder.createdAt).getTime() / 1000);
    
    // 处理特殊属性
    let attributes = `ADD_DATE="${addDate}" LAST_MODIFIED="${lastModified}"`;
    if (folder.isPersonalToolbar) {
      attributes += ' PERSONAL_TOOLBAR_FOLDER="true"';
    }
    
    let html = `${spaces}<DT><H3 ${attributes}>${escapeHtml(folder.name)}</H3>\n`;
    html += `${spaces}<DL><p>\n`;
    
    // 添加该文件夹下的书签
    const folderBookmarks = bookmarks.filter(bookmark => bookmark.group === folder.id);
    folderBookmarks.forEach(bookmark => {
      const bookmarkDate = bookmark.timestamp ? Math.floor(new Date(bookmark.timestamp).getTime() / 1000) : now;
      const iconAttr = bookmark.favicon ? ` ICON="${escapeHtml(bookmark.favicon)}"` : '';
      html += `${spaces}    <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${bookmarkDate}"${iconAttr}>${escapeHtml(bookmark.title)}</A>\n`;
    });
    
    // 添加子文件夹
    folder.children.forEach(childFolder => {
      html += generateFolderHTML(childFolder, indent + 1);
    });
    
    html += `${spaces}</DL><p>\n`;
    return html;
  };
  
  // 生成书签HTML内容
  let content = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
  
  // 优先添加个人工具栏文件夹（如果有）
  const personalToolbarFolder = rootFolders.find(folder => folder.isPersonalToolbar);
  if (personalToolbarFolder) {
    content += generateFolderHTML(personalToolbarFolder, 0);
  }
  
  // 添加根级别的书签（没有文件夹的书签）
  const rootBookmarks = bookmarks.filter(bookmark => bookmark.group === 'default' || !bookmark.group);
  rootBookmarks.forEach(bookmark => {
    const bookmarkDate = bookmark.timestamp ? Math.floor(new Date(bookmark.timestamp).getTime() / 1000) : now;
    const iconAttr = bookmark.favicon ? ` ICON="${escapeHtml(bookmark.favicon)}"` : '';
    content += `    <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${bookmarkDate}"${iconAttr}>${escapeHtml(bookmark.title)}</A>\n`;
  });
  
  // 添加其他根文件夹
  rootFolders.forEach(folder => {
    if (!folder.isPersonalToolbar) {
      content += generateFolderHTML(folder, 0);
    }
  });
  
  content += `</DL><p>\n`;
  
  return content;
};

// HTML转义函数
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 导出书签到文件
export const exportBookmarksToFile = (bookmarks, folders, filename = 'bookmarks.html') => {
  const content = exportBookmarksToNetscape(bookmarks, folders);
  
  // 创建Blob对象
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  URL.revokeObjectURL(url);
};